import { and, desc, eq, inArray } from 'drizzle-orm';
import {
    db,
    messagesTable,
    roomMembersTable,
    roomsTable,
    usersTable,
} from '../../../shared/db';
import { logger } from '../../../shared/logger';
import { ChatServiceError } from '../errors';
import type { RoomWithDetails } from '../model';
import { contactService } from './contact.service';

export class RoomService {
    async isUserInRoom(userId: string, roomId: string): Promise<boolean> {
        const members = await db
            .select({ userId: roomMembersTable.userId })
            .from(roomMembersTable)
            .where(and(eq(roomMembersTable.roomId, roomId), eq(roomMembersTable.userId, userId)))
            .limit(1);
        return members.length > 0;
    }

    async getOrCreateDirectRoom(userAId: string, userBId: string): Promise<string> {
        if (await contactService.isBlockedBetween(userAId, userBId)) {
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
            if (await contactService.isBlockedBetween(creatorId, memberId)) continue;
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

        if (await contactService.isBlockedBetween(actorId, targetUserId)) {
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
}

export const roomService = new RoomService();
