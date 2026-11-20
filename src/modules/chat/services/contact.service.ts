import { and, eq, ilike, inArray, ne, or } from 'drizzle-orm';
import { db, friendshipsTable, usersTable } from '../../../shared/db';
import { logger } from '../../../shared/logger';
import { ChatServiceError } from '../errors';
import type {
    FriendshipStatus,
    RelationStatus,
    RequestFriendship,
    UserSearchResult,
} from '../model';

export class ContactService {
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
}

export const contactService = new ContactService();
