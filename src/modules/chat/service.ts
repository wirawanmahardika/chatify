import { desc, lt, gt, eq, and, ne, inArray, or, ilike, sql as drizzleSql } from 'drizzle-orm';
import {
    db,
    messagesTable,
    usersTable,
    roomsTable,
    roomMembersTable,
    friendshipsTable,
} from '../../shared/db';
import { logger } from '../../shared/logger';
import type {
    FriendshipStatus,
    Message,
    MessageType,
    MessageWithUser,
    RelationStatus,
    RequestFriendship,
    RoomWithDetails,
    UserSearchResult,
} from './model';

export class ChatServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ChatServiceError';
    }
}

export class ChatService {
    private async getRelationBetween(userAId: string, userBId: string) {
        const [relation] = await db
            .select()
            .from(friendshipsTable)
            .where(
                or(
                    and(
                        eq(friendshipsTable.senderId, userAId),
                        eq(friendshipsTable.receiverId, userBId)
                    ),
                    and(
                        eq(friendshipsTable.senderId, userBId),
                        eq(friendshipsTable.receiverId, userAId)
                    )
                )
            )
            .limit(1);

        return relation ?? null;
    }

    async isBlockedBetween(userAId: string, userBId: string): Promise<boolean> {
        const relation = await this.getRelationBetween(userAId, userBId);
        return relation?.status === 'blocked';
    }

    async searchUsers(currentUserId: string, rawQuery: string): Promise<UserSearchResult[]> {
        const q = rawQuery.trim();
        if (!q) return [];

        const isSixDigitId = /^\d{6}$/.test(q);
        if (!isSixDigitId && q.length < 3) {
            throw new ChatServiceError('Masukkan minimal 3 karakter username atau ID 6 digit');
        }

        const matchedUsers = await db
            .select({
                id: usersTable.id,
                username: usersTable.username,
                avatarUrl: usersTable.avatarUrl,
            })
            .from(usersTable)
            .where(
                and(
                    ne(usersTable.id, currentUserId),
                    isSixDigitId ? eq(usersTable.id, q) : ilike(usersTable.username, `%${q}%`)
                )
            )
            .orderBy(usersTable.username)
            .limit(10);

        if (matchedUsers.length === 0) return [];

        const matchedIds = matchedUsers.map((u) => u.id);
        const relations = await db
            .select()
            .from(friendshipsTable)
            .where(
                or(
                    and(
                        eq(friendshipsTable.senderId, currentUserId),
                        inArray(friendshipsTable.receiverId, matchedIds)
                    ),
                    and(
                        inArray(friendshipsTable.senderId, matchedIds),
                        eq(friendshipsTable.receiverId, currentUserId)
                    )
                )
            );

        const relationMap = new Map<string, RelationStatus>();
        for (const rel of relations) {
            const otherId = rel.senderId === currentUserId ? rel.receiverId : rel.senderId;
            if (rel.status === 'blocked') {
                relationMap.set(otherId, 'blocked');
            } else if (rel.status === 'accepted') {
                relationMap.set(otherId, 'accepted');
            } else if (rel.status === 'pending') {
                relationMap.set(
                    otherId,
                    rel.senderId === currentUserId ? 'pending_outgoing' : 'pending_incoming'
                );
            } else {
                relationMap.set(otherId, 'none');
            }
        }

        return matchedUsers
            .filter((u) => relationMap.get(u.id) !== 'blocked')
            .map((u) => ({
                id: u.id,
                username: u.username,
                avatarUrl: u.avatarUrl,
                relationStatus: relationMap.get(u.id) ?? 'none',
            }));
    }

    async getInvitePreview(
        currentUserId: string,
        targetId: string
    ): Promise<UserSearchResult | null> {
        if (currentUserId === targetId) return null;

        const [target] = await db
            .select({
                id: usersTable.id,
                username: usersTable.username,
                avatarUrl: usersTable.avatarUrl,
            })
            .from(usersTable)
            .where(eq(usersTable.id, targetId))
            .limit(1);

        if (!target) return null;

        const relation = await this.getRelationBetween(currentUserId, targetId);
        let relationStatus: RelationStatus = 'none';
        if (relation) {
            if (relation.status === 'blocked') {
                return null;
            } else if (relation.status === 'accepted') {
                relationStatus = 'accepted';
            } else if (relation.status === 'pending') {
                relationStatus =
                    relation.senderId === currentUserId ? 'pending_outgoing' : 'pending_incoming';
            }
        }

        return {
            id: target.id,
            username: target.username,
            avatarUrl: target.avatarUrl,
            relationStatus,
        };
    }

    async addFriendship(senderId: string, receiverId: string): Promise<void> {
        if (senderId === receiverId) {
            throw new ChatServiceError('Tidak dapat menambahkan diri sendiri sebagai teman');
        }

        const [receiver] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.id, receiverId))
            .limit(1);

        if (!receiver) {
            throw new ChatServiceError('Pengguna tidak ditemukan');
        }

        const relation = await this.getRelationBetween(senderId, receiverId);
        if (relation) {
            if (relation.status === 'accepted') {
                throw new ChatServiceError('Anda sudah berteman dengan pengguna ini');
            }
            if (relation.status === 'pending') {
                throw new ChatServiceError('Permintaan pertemanan masih menunggu konfirmasi');
            }
            if (relation.status === 'blocked') {
                throw new ChatServiceError('Tidak dapat mengirim permintaan pertemanan');
            }

            await db
                .delete(friendshipsTable)
                .where(
                    and(
                        eq(friendshipsTable.senderId, relation.senderId),
                        eq(friendshipsTable.receiverId, relation.receiverId)
                    )
                );
        }

        await db.insert(friendshipsTable).values({
            senderId,
            receiverId,
            status: 'pending',
        });

        logger.info('Permintaan pertemanan dikirim', {
            module: 'chat',
            userId: senderId,
            targetUserId: receiverId,
        });
    }

    async cancelFriendRequest(senderId: string, receiverId: string): Promise<void> {
        const deleted = await db
            .delete(friendshipsTable)
            .where(
                and(
                    eq(friendshipsTable.senderId, senderId),
                    eq(friendshipsTable.receiverId, receiverId),
                    eq(friendshipsTable.status, 'pending')
                )
            )
            .returning({ receiverId: friendshipsTable.receiverId });

        if (deleted.length === 0) {
            throw new ChatServiceError('Permintaan pertemanan tidak ditemukan');
        }
    }

    async blockUser(userId: string, targetUserId: string): Promise<void> {
        if (userId === targetUserId) {
            throw new ChatServiceError('Tidak dapat memblokir diri sendiri');
        }

        const [target] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.id, targetUserId))
            .limit(1);

        if (!target) {
            throw new ChatServiceError('Pengguna tidak ditemukan');
        }

        const existing = await this.getRelationBetween(userId, targetUserId);
        if (existing) {
            await db
                .update(friendshipsTable)
                .set({
                    status: 'blocked',
                    blockedBy: userId,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(friendshipsTable.senderId, existing.senderId),
                        eq(friendshipsTable.receiverId, existing.receiverId)
                    )
                );
        } else {
            await db.insert(friendshipsTable).values({
                senderId: userId,
                receiverId: targetUserId,
                status: 'blocked',
                blockedBy: userId,
            });
        }

        logger.info('Pengguna diblokir', {
            module: 'chat',
            userId,
            targetUserId,
        });
    }

    async unblockUser(userId: string, targetUserId: string): Promise<void> {
        const deleted = await db
            .delete(friendshipsTable)
            .where(
                and(
                    or(
                        and(
                            eq(friendshipsTable.senderId, userId),
                            eq(friendshipsTable.receiverId, targetUserId)
                        ),
                        and(
                            eq(friendshipsTable.senderId, targetUserId),
                            eq(friendshipsTable.receiverId, userId)
                        )
                    ),
                    eq(friendshipsTable.status, 'blocked'),
                    eq(friendshipsTable.blockedBy, userId)
                )
            )
            .returning({ senderId: friendshipsTable.senderId });

        if (deleted.length === 0) {
            throw new ChatServiceError('Pengguna tidak ditemukan dalam daftar blokir Anda');
        }

        logger.info('Blokir pengguna dibuka', {
            module: 'chat',
            userId,
            targetUserId,
        });
    }

    async getBlockedUsers(userId: string): Promise<RequestFriendship[]> {
        const rows = await db
            .select({
                senderId: friendshipsTable.senderId,
                receiverId: friendshipsTable.receiverId,
                createdAt: friendshipsTable.updatedAt,
            })
            .from(friendshipsTable)
            .where(
                and(
                    eq(friendshipsTable.status, 'blocked'),
                    eq(friendshipsTable.blockedBy, userId)
                )
            );

        if (rows.length === 0) return [];

        const oppositeIds = rows.map((r) => (r.senderId === userId ? r.receiverId : r.senderId));
        const users = await db
            .select({
                id: usersTable.id,
                username: usersTable.username,
                avatarUrl: usersTable.avatarUrl,
            })
            .from(usersTable)
            .where(inArray(usersTable.id, oppositeIds));
        const userMap = new Map(users.map((u) => [u.id, u]));

        return rows.map((row) => {
            const oppositeId = row.senderId === userId ? row.receiverId : row.senderId;
            const info = userMap.get(oppositeId);
            return {
                oppositeId,
                status: 'blocked' as const,
                direction: row.senderId === userId ? ('outgoing' as const) : ('incoming' as const),
                username: info?.username ?? 'Pengguna',
                avatarUrl: info?.avatarUrl ?? null,
                createdAt: row.createdAt,
            };
        });
    }

    async getFriendship(userId: string): Promise<RequestFriendship[]> {
        const rows = await db
            .select({
                senderId: friendshipsTable.senderId,
                receiverId: friendshipsTable.receiverId,
                status: friendshipsTable.status,
                createdAt: friendshipsTable.createdAt,
            })
            .from(friendshipsTable)
            .where(
                and(
                    or(
                        eq(friendshipsTable.receiverId, userId),
                        eq(friendshipsTable.senderId, userId)
                    ),
                    ne(friendshipsTable.status, 'rejected'),
                    ne(friendshipsTable.status, 'blocked')
                )
            );

        if (rows.length === 0) return [];

        const oppositeIds = Array.from(
            new Set(rows.map((r) => (r.senderId === userId ? r.receiverId : r.senderId)))
        );

        const users = await db
            .select({
                id: usersTable.id,
                username: usersTable.username,
                avatarUrl: usersTable.avatarUrl,
            })
            .from(usersTable)
            .where(inArray(usersTable.id, oppositeIds));

        const userMap = new Map(users.map((u) => [u.id, u]));

        return rows.map((row) => {
            const oppositeId = row.senderId === userId ? row.receiverId : row.senderId;
            const info = userMap.get(oppositeId);
            return {
                oppositeId,
                status: row.status,
                direction: row.receiverId === userId ? 'incoming' : 'outgoing',
                username: info?.username ?? 'Pengguna',
                avatarUrl: info?.avatarUrl ?? null,
                createdAt: row.createdAt,
            };
        });
    }

    async updateStatusFriendship(
        userId: string,
        oppositeId: string,
        status: Exclude<FriendshipStatus, 'pending'>
    ): Promise<void> {
        if (status === 'blocked') {
            await this.blockUser(userId, oppositeId);
            return;
        }

        const updated = await db
            .update(friendshipsTable)
            .set({
                status,
                blockedBy: null,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(friendshipsTable.receiverId, userId),
                    eq(friendshipsTable.senderId, oppositeId),
                    eq(friendshipsTable.status, 'pending')
                )
            )
            .returning({ senderId: friendshipsTable.senderId });

        if (updated.length === 0) {
            throw new ChatServiceError('Permintaan pertemanan tidak ditemukan');
        }
    }

    async getOrCreateDirectRoom(userAId: string, userBId: string): Promise<string> {
        if (await this.isBlockedBetween(userAId, userBId)) {
            throw new ChatServiceError('Tidak dapat memulai obrolan karena pengguna diblokir');
        }

        const userARooms = await db
            .select({ roomId: roomMembersTable.roomId })
            .from(roomMembersTable)
            .innerJoin(roomsTable, eq(roomMembersTable.roomId, roomsTable.id))
            .where(and(eq(roomMembersTable.userId, userAId), eq(roomsTable.type, 'direct')));

        const roomIds = userARooms.map((r) => r.roomId);
        if (roomIds.length > 0) {
            const sharedRooms = await db
                .select({ roomId: roomMembersTable.roomId })
                .from(roomMembersTable)
                .where(
                    and(
                        inArray(roomMembersTable.roomId, roomIds),
                        eq(roomMembersTable.userId, userBId)
                    )
                )
                .limit(1);

            if (sharedRooms.length > 0) {
                return sharedRooms[0].roomId;
            }
        }

        const newRoomId = crypto.randomUUID();
        await db.insert(roomsTable).values({
            id: newRoomId,
            type: 'direct',
            createdBy: userAId,
        });

        await db.insert(roomMembersTable).values([
            { roomId: newRoomId, userId: userAId, role: 'member' },
            { roomId: newRoomId, userId: userBId, role: 'member' },
        ]);

        return newRoomId;
    }

    async createGroupRoom(
        creatorId: string,
        name: string,
        memberIds: string[] = []
    ): Promise<string> {
        const uniqueMemberIds = Array.from(
            new Set(memberIds.filter((id) => id && id !== creatorId))
        );

        const validMemberIds: string[] = [];
        for (const memberId of uniqueMemberIds) {
            const [exists] = await db
                .select({ id: usersTable.id })
                .from(usersTable)
                .where(eq(usersTable.id, memberId))
                .limit(1);
            if (!exists) continue;
            if (await this.isBlockedBetween(creatorId, memberId)) continue;
            validMemberIds.push(memberId);
        }

        const newRoomId = crypto.randomUUID();
        await db.insert(roomsTable).values({
            id: newRoomId,
            name: name.trim(),
            type: 'group',
            createdBy: creatorId,
        });

        await db.insert(roomMembersTable).values([
            { roomId: newRoomId, userId: creatorId, role: 'owner' },
            ...validMemberIds.map((userId) => ({
                roomId: newRoomId,
                userId,
                role: 'member' as const,
            })),
        ]);

        logger.info('Grup baru dibuat', {
            module: 'chat',
            userId: creatorId,
            roomId: newRoomId,
            memberCount: validMemberIds.length + 1,
        });

        return newRoomId;
    }

    async getGroupDetails(roomId: string, userId: string) {
        const [room] = await db
            .select()
            .from(roomsTable)
            .where(and(eq(roomsTable.id, roomId), eq(roomsTable.type, 'group')))
            .limit(1);

        if (!room) {
            throw new ChatServiceError('Grup tidak ditemukan');
        }

        const members = await db
            .select({
                userId: usersTable.id,
                username: usersTable.username,
                avatarUrl: usersTable.avatarUrl,
                role: roomMembersTable.role,
            })
            .from(roomMembersTable)
            .innerJoin(usersTable, eq(roomMembersTable.userId, usersTable.id))
            .where(eq(roomMembersTable.roomId, roomId));

        const self = members.find((m) => m.userId === userId);
        if (!self) {
            throw new ChatServiceError('Anda bukan anggota grup ini');
        }

        return {
            room,
            members,
            currentUserRole: self.role,
        };
    }

    async addGroupMember(roomId: string, actorId: string, targetUserId: string): Promise<void> {
        const details = await this.getGroupDetails(roomId, actorId);
        if (details.currentUserRole !== 'owner' && details.currentUserRole !== 'admin') {
            throw new ChatServiceError('Hanya pemilik atau admin grup yang dapat menambah anggota');
        }

        if (await this.isBlockedBetween(actorId, targetUserId)) {
            throw new ChatServiceError('Tidak dapat menambahkan pengguna yang diblokir');
        }

        const [target] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.id, targetUserId))
            .limit(1);
        if (!target) {
            throw new ChatServiceError('Pengguna tidak ditemukan');
        }

        if (details.members.some((m) => m.userId === targetUserId)) {
            throw new ChatServiceError('Pengguna sudah menjadi anggota grup');
        }

        await db.insert(roomMembersTable).values({
            roomId,
            userId: targetUserId,
            role: 'member',
        });
    }

    async removeGroupMember(
        roomId: string,
        actorId: string,
        targetUserId: string
    ): Promise<void> {
        const details = await this.getGroupDetails(roomId, actorId);
        const target = details.members.find((m) => m.userId === targetUserId);
        if (!target) {
            throw new ChatServiceError('Pengguna bukan anggota grup ini');
        }

        const isSelfLeave = actorId === targetUserId;
        const canManage =
            details.currentUserRole === 'owner' || details.currentUserRole === 'admin';

        if (!isSelfLeave && !canManage) {
            throw new ChatServiceError('Anda tidak memiliki izin mengeluarkan anggota');
        }
        if (!isSelfLeave && target.role === 'owner') {
            throw new ChatServiceError('Pemilik grup tidak dapat dikeluarkan');
        }

        await db
            .delete(roomMembersTable)
            .where(
                and(eq(roomMembersTable.roomId, roomId), eq(roomMembersTable.userId, targetUserId))
            );
    }

    async markRoomAsRead(roomId: string, userId: string): Promise<void> {
        await db
            .update(roomMembersTable)
            .set({ lastReadAt: new Date() })
            .where(and(eq(roomMembersTable.roomId, roomId), eq(roomMembersTable.userId, userId)));
    }

    async canSendMessageInRoom(userId: string, roomId: string): Promise<boolean> {
        const isMember = await this.isUserInRoom(userId, roomId);
        if (!isMember) return false;

        const [room] = await db
            .select({ type: roomsTable.type })
            .from(roomsTable)
            .where(eq(roomsTable.id, roomId))
            .limit(1);

        if (!room) return false;
        if (room.type !== 'direct') return true;

        const [opponent] = await db
            .select({ userId: roomMembersTable.userId })
            .from(roomMembersTable)
            .where(and(eq(roomMembersTable.roomId, roomId), ne(roomMembersTable.userId, userId)))
            .limit(1);

        if (!opponent) return true;
        return !(await this.isBlockedBetween(userId, opponent.userId));
    }

    async canAccessUpload(userId: string, attachmentUrl: string): Promise<boolean> {
        const [msg] = await db
            .select({ roomId: messagesTable.roomId })
            .from(messagesTable)
            .where(eq(messagesTable.attachmentUrl, attachmentUrl))
            .limit(1);

        if (!msg) return false;
        return this.isUserInRoom(userId, msg.roomId);
    }

    async getUserRooms(
        userId: string,
        onlineUserIds: Set<string> = new Set()
    ): Promise<RoomWithDetails[]> {
        const userRooms = await db
            .select({
                id: roomsTable.id,
                name: roomsTable.name,
                type: roomsTable.type,
                createdAt: roomsTable.createdAt,
                lastReadAt: roomMembersTable.lastReadAt,
            })
            .from(roomMembersTable)
            .innerJoin(roomsTable, eq(roomMembersTable.roomId, roomsTable.id))
            .where(eq(roomMembersTable.userId, userId));

        if (userRooms.length === 0) return [];

        const roomIds = userRooms.map((r) => r.id);

        const members = await db
            .select({
                roomId: roomMembersTable.roomId,
                userId: usersTable.id,
                username: usersTable.username,
                avatarUrl: usersTable.avatarUrl,
            })
            .from(roomMembersTable)
            .innerJoin(usersTable, eq(roomMembersTable.userId, usersTable.id))
            .where(inArray(roomMembersTable.roomId, roomIds));

        const memberCountMap = new Map<string, number>();
        const opponentMap = new Map<
            string,
            { id: string; username: string; avatarUrl: string | null }
        >();
        for (const member of members) {
            memberCountMap.set(member.roomId, (memberCountMap.get(member.roomId) ?? 0) + 1);
            if (member.userId !== userId && !opponentMap.has(member.roomId)) {
                opponentMap.set(member.roomId, {
                    id: member.userId,
                    username: member.username,
                    avatarUrl: member.avatarUrl ?? null,
                });
            }
        }

        const recentMessages = await db
            .select({
                roomId: messagesTable.roomId,
                userId: messagesTable.userId,
                type: messagesTable.type,
                content: messagesTable.content,
                createdAt: messagesTable.createdAt,
            })
            .from(messagesTable)
            .where(inArray(messagesTable.roomId, roomIds))
            .orderBy(desc(messagesTable.id));

        const lastReadMap = new Map(userRooms.map((r) => [r.id, r.lastReadAt.getTime()]));
        const unreadCountMap = new Map<string, number>();
        const latestMessageMap = new Map<
            string,
            { sender: string; content: string; createdAt: Date }
        >();

        for (const msg of recentMessages) {
            if (!latestMessageMap.has(msg.roomId)) {
                const preview =
                    msg.type === 'image'
                        ? '📷 Gambar'
                        : msg.type === 'file'
                          ? `📎 ${msg.content}`
                          : msg.content;
                latestMessageMap.set(msg.roomId, {
                    sender: msg.userId,
                    content: preview,
                    createdAt: msg.createdAt,
                });
            }

            const lastRead = lastReadMap.get(msg.roomId) ?? 0;
            if (msg.userId !== userId && msg.createdAt.getTime() > lastRead) {
                unreadCountMap.set(msg.roomId, (unreadCountMap.get(msg.roomId) ?? 0) + 1);
            }
        }

        const result: RoomWithDetails[] = userRooms.map((room) => {
            const opponent = room.type === 'direct' ? opponentMap.get(room.id) : undefined;
            return {
                id: room.id,
                name: room.name,
                type: room.type,
                opponentId: opponent?.id ?? null,
                opponentName: opponent?.username ?? null,
                opponentAvatarUrl: opponent?.avatarUrl ?? null,
                isOpponentOnline: opponent ? onlineUserIds.has(opponent.id) : false,
                memberCount: memberCountMap.get(room.id) ?? 1,
                unreadCount: unreadCountMap.get(room.id) ?? 0,
                lastMessage: latestMessageMap.get(room.id) ?? null,
            };
        });

        result.sort((a, b) => {
            const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return timeB - timeA;
        });

        return result;
    }

    async getRoomHistory(
        roomId: string,
        limit: number = 50,
        cursorId?: number
    ): Promise<MessageWithUser[]> {
        const condition =
            cursorId !== undefined
                ? and(eq(messagesTable.roomId, roomId), lt(messagesTable.id, cursorId))
                : eq(messagesTable.roomId, roomId);

        return db
            .select({
                id: messagesTable.id,
                roomId: messagesTable.roomId,
                userId: messagesTable.userId,
                type: messagesTable.type,
                content: messagesTable.content,
                attachmentUrl: messagesTable.attachmentUrl,
                attachmentName: messagesTable.attachmentName,
                createdAt: messagesTable.createdAt,
                username: usersTable.username,
            })
            .from(messagesTable)
            .innerJoin(usersTable, eq(messagesTable.userId, usersTable.id))
            .where(condition)
            .orderBy(desc(messagesTable.id))
            .limit(limit);
    }

    async createMessage(data: {
        roomId: string;
        userId: string;
        content: string;
        type?: MessageType;
        attachmentUrl?: string | null;
        attachmentName?: string | null;
    }): Promise<Message> {
        const [created] = await db
            .insert(messagesTable)
            .values({
                roomId: data.roomId,
                userId: data.userId,
                type: data.type ?? 'text',
                content: data.content,
                attachmentUrl: data.attachmentUrl ?? null,
                attachmentName: data.attachmentName ?? null,
            })
            .returning({
                id: messagesTable.id,
                roomId: messagesTable.roomId,
                userId: messagesTable.userId,
                type: messagesTable.type,
                content: messagesTable.content,
                attachmentUrl: messagesTable.attachmentUrl,
                attachmentName: messagesTable.attachmentName,
                createdAt: messagesTable.createdAt,
            });

        return created;
    }

    async isUserInRoom(userId: string, roomId: string): Promise<boolean> {
        const members = await db
            .select({ userId: roomMembersTable.userId })
            .from(roomMembersTable)
            .where(and(eq(roomMembersTable.roomId, roomId), eq(roomMembersTable.userId, userId)))
            .limit(1);
        return members.length > 0;
    }

    async getContacts(userId: string): Promise<{ id: string; username: string }[]> {
        const friendships = await this.getFriendship(userId);
        return friendships
            .filter((f) => f.status === 'accepted')
            .map((f) => ({ id: f.oppositeId, username: f.username }));
    }

    async getAllOtherUsers(currentUserId: string): Promise<{ id: string; username: string }[]> {
        return db
            .select({
                id: usersTable.id,
                username: usersTable.username,
            })
            .from(usersTable)
            .where(ne(usersTable.id, currentUserId))
            .orderBy(usersTable.username);
    }

    async getRoomAndOpponent(
        roomId: string,
        userId: string,
        onlineUserIds: Set<string> = new Set()
    ) {
        const [room] = await db
            .select({
                id: roomsTable.id,
                name: roomsTable.name,
                type: roomsTable.type,
            })
            .from(roomsTable)
            .where(eq(roomsTable.id, roomId))
            .limit(1);

        if (!room) return null;

        const members = await db
            .select({
                userId: usersTable.id,
                username: usersTable.username,
                avatarUrl: usersTable.avatarUrl,
            })
            .from(roomMembersTable)
            .innerJoin(usersTable, eq(roomMembersTable.userId, usersTable.id))
            .where(eq(roomMembersTable.roomId, roomId));

        const opponent = members.find((m) => m.userId !== userId);

        return {
            id: room.id,
            name: room.name || '',
            type: room.type,
            opponentId: opponent?.userId ?? '',
            opponentName: opponent?.username ?? '',
            opponentAvatarUrl: opponent?.avatarUrl ?? null,
            isOpponentOnline: opponent ? onlineUserIds.has(opponent.userId) : false,
            memberCount: members.length,
        };
    }

    async getPreviousMessages(roomId: string, beforeDate: Date, limit: number) {
        return db
            .select({
                senderId: messagesTable.userId,
                sender: usersTable.username,
                type: messagesTable.type,
                content: messagesTable.content,
                attachmentUrl: messagesTable.attachmentUrl,
                attachmentName: messagesTable.attachmentName,
                createdAt: messagesTable.createdAt,
            })
            .from(messagesTable)
            .innerJoin(usersTable, eq(messagesTable.userId, usersTable.id))
            .where(and(eq(messagesTable.roomId, roomId), lt(messagesTable.createdAt, beforeDate)))
            .orderBy(desc(messagesTable.createdAt))
            .limit(limit);
    }
}

export const chatService = new ChatService();
