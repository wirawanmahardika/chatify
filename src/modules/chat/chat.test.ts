import { describe, it, expect, beforeEach } from 'bun:test';
import {
    db,
    friendshipsTable,
    messagesTable,
    roomMembersTable,
    roomsTable,
    sessionsTable,
    usersTable,
} from '../../shared/db';
import { createApp } from '../../app';
import { authService } from '../auth/service';
import {
    addFriendshipBodySchema,
    createGroupBodySchema,
    sendMessageSchema,
    wsIncomingMessageSchema,
} from './model';
import { chatService, ChatServiceError } from './service';

describe('Chat Module', () => {
    beforeEach(async () => {
        await db.delete(messagesTable);
        await db.delete(roomMembersTable);
        await db.delete(roomsTable);
        await db.delete(friendshipsTable);
        await db.delete(sessionsTable);
        await db.delete(usersTable);
    });

    describe('Zod Validation', () => {
        it('menolak pesan kosong atau terlalu panjang', () => {
            const emptyRes = sendMessageSchema.safeParse({ roomId: 'room-1', content: '   ' });
            expect(emptyRes.success).toBe(false);

            const longRes = sendMessageSchema.safeParse({
                roomId: 'room-1',
                content: 'a'.repeat(1001),
            });
            expect(longRes.success).toBe(false);
        });

        it('memvalidasi payload WebSocket chatting', () => {
            const valid = wsIncomingMessageSchema.safeParse({
                type: 'chatting',
                roomId: 'room-1',
                message: 'Halo dunia',
            });
            expect(valid.success).toBe(true);

            const invalid = wsIncomingMessageSchema.safeParse({
                type: 'unknown',
                roomId: 'room-1',
                message: 'Halo',
            });
            expect(invalid.success).toBe(false);
        });

        it('menolak add friendship dengan ID kosong', () => {
            const res = addFriendshipBodySchema.safeParse({ id: '  ' });
            expect(res.success).toBe(false);
        });

        it('memvalidasi payload typing WebSocket dan pembuatan grup', () => {
            expect(
                wsIncomingMessageSchema.safeParse({
                    type: 'typing',
                    roomId: 'room-1',
                    isTyping: true,
                }).success
            ).toBe(true);

            const invalidGroup = createGroupBodySchema.safeParse({ name: 'A' });
            expect(invalidGroup.success).toBe(false);
        });
    });

    describe('Friendship & Room Service', () => {
        it('mencegah tambah diri sendiri dan menampilkan kontak dua arah setelah diterima', async () => {
            const userA = await authService.register({ username: 'user_a', password: 'password123' });
            const userB = await authService.register({ username: 'user_b', password: 'password123' });

            await expect(chatService.addFriendship(userA.id, userA.id)).rejects.toThrow(
                ChatServiceError
            );

            await chatService.addFriendship(userA.id, userB.id);

            await expect(chatService.addFriendship(userA.id, userB.id)).rejects.toThrow(
                ChatServiceError
            );

            await chatService.updateStatusFriendship(userB.id, userA.id, 'accepted');

            const contactsA = await chatService.getContacts(userA.id);
            const contactsB = await chatService.getContacts(userB.id);

            expect(contactsA).toEqual([{ id: userB.id, username: 'user_b' }]);
            expect(contactsB).toEqual([{ id: userA.id, username: 'user_a' }]);
        });

        it('dapat mencari teman via username (>=3 karakter) atau ID 6 digit dan membatalkan permintaan', async () => {
            const userA = await authService.register({ username: 'andi_satu', password: 'password123' });
            const userB = await authService.register({ username: 'budi_dua', password: 'password123' });

            await expect(chatService.searchUsers(userA.id, 'bu')).rejects.toThrow(
                ChatServiceError
            );

            const byUsername = await chatService.searchUsers(userA.id, 'BUDI');
            expect(byUsername).toEqual([
                { id: userB.id, username: 'budi_dua', relationStatus: 'none' },
            ]);

            const byId = await chatService.searchUsers(userA.id, userB.id);
            expect(byId).toEqual([
                { id: userB.id, username: 'budi_dua', relationStatus: 'none' },
            ]);

            await chatService.addFriendship(userA.id, userB.id);
            const afterRequest = await chatService.searchUsers(userA.id, 'budi');
            expect(afterRequest[0].relationStatus).toBe('pending_outgoing');

            await chatService.cancelFriendRequest(userA.id, userB.id);
            const afterCancel = await chatService.searchUsers(userA.id, 'budi');
            expect(afterCancel[0].relationStatus).toBe('none');
        });

        it('dapat memblokir dan membuka blokir teman serta mencegah DM saat diblokir', async () => {
            const userA = await authService.register({ username: 'rani_1', password: 'password123' });
            const userB = await authService.register({ username: 'doni_2', password: 'password123' });

            await chatService.addFriendship(userA.id, userB.id);
            await chatService.updateStatusFriendship(userB.id, userA.id, 'accepted');

            const roomId = await chatService.getOrCreateDirectRoom(userA.id, userB.id);
            expect(await chatService.canSendMessageInRoom(userA.id, roomId)).toBe(true);

            await chatService.blockUser(userA.id, userB.id);

            expect(await chatService.getContacts(userA.id)).toEqual([]);
            expect(await chatService.getContacts(userB.id)).toEqual([]);
            expect(await chatService.searchUsers(userA.id, 'doni')).toEqual([]);
            expect(await chatService.getInvitePreview(userB.id, userA.id)).toBeNull();
            expect(await chatService.canSendMessageInRoom(userA.id, roomId)).toBe(false);
            expect(await chatService.canSendMessageInRoom(userB.id, roomId)).toBe(false);

            await expect(chatService.getOrCreateDirectRoom(userB.id, userA.id)).rejects.toThrow(
                ChatServiceError
            );

            // Hanya pelaku blokir (userA) yang boleh membuka blokir
            await expect(chatService.unblockUser(userB.id, userA.id)).rejects.toThrow(
                ChatServiceError
            );

            await chatService.unblockUser(userA.id, userB.id);
            expect(await chatService.isBlockedBetween(userA.id, userB.id)).toBe(false);
            expect(await chatService.canSendMessageInRoom(userA.id, roomId)).toBe(true);
        });

        it('dapat membuat grup, mengelola anggota dengan otorisasi, dan menghitung unread count', async () => {
            const owner = await authService.register({ username: 'owner_g', password: 'password123' });
            const member = await authService.register({ username: 'member_g', password: 'password123' });
            const extra = await authService.register({ username: 'extra_g', password: 'password123' });

            const groupId = await chatService.createGroupRoom(owner.id, 'Grup Belajar', [member.id]);
            const details = await chatService.getGroupDetails(groupId, owner.id);
            expect(details.room.name).toBe('Grup Belajar');
            expect(details.members).toHaveLength(2);

            await expect(
                chatService.addGroupMember(groupId, member.id, extra.id)
            ).rejects.toThrow(ChatServiceError);

            await chatService.addGroupMember(groupId, owner.id, extra.id);
            expect((await chatService.getGroupDetails(groupId, owner.id)).members).toHaveLength(3);

            await chatService.createMessage({
                roomId: groupId,
                userId: owner.id,
                content: 'Halo semuanya!',
            });

            const memberRoomsBefore = await chatService.getUserRooms(member.id);
            expect(memberRoomsBefore[0].unreadCount).toBe(1);

            await chatService.markRoomAsRead(groupId, member.id);
            const memberRoomsAfter = await chatService.getUserRooms(member.id);
            expect(memberRoomsAfter[0].unreadCount).toBe(0);

            await chatService.removeGroupMember(groupId, extra.id, extra.id);
            expect((await chatService.getGroupDetails(groupId, owner.id)).members).toHaveLength(2);
        });
    });

    describe('Anti-IDOR Security Regression', () => {
        it('menolak user yang bukan anggota room saat mengakses GET /room/:roomId dan GET /messages/:roomId', async () => {
            const userA = await authService.register({ username: 'alice_1', password: 'password123' });
            const userB = await authService.register({ username: 'bob_1', password: 'password123' });
            await authService.register({ username: 'eve_1', password: 'password123' });

            const roomId = await chatService.getOrCreateDirectRoom(userA.id, userB.id);
            await chatService.createMessage({
                roomId,
                userId: userA.id,
                content: 'Pesan rahasia',
            });

            const app = createApp();
            const eveLoginRes = await app.handle(
                new Request('http://localhost/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'eve_1', password: 'password123' }),
                })
            );
            const cookieHeader = eveLoginRes.headers.get('set-cookie')!;

            const roomRes = await app.handle(
                new Request(`http://localhost/room/${roomId}`, {
                    headers: { Cookie: cookieHeader },
                })
            );
            expect(roomRes.status).toBe(403);

            const messagesRes = await app.handle(
                new Request(
                    `http://localhost/messages/${roomId}?beforeDate=${encodeURIComponent(new Date(Date.now() + 60000).toISOString())}`,
                    {
                        headers: { Cookie: cookieHeader },
                    }
                )
            );
            expect(messagesRes.status).toBe(403);
        });

        it('GET /contact/invite/:id dan GET /contact/search merender halaman dan hasil pencarian dengan aman', async () => {
            const userA = await authService.register({ username: 'taro_1', password: 'password123' });
            await authService.register({ username: 'sinta_2', password: 'password123' });

            const app = createApp();
            const loginRes = await app.handle(
                new Request('http://localhost/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'sinta_2', password: 'password123' }),
                })
            );
            const cookieHeader = loginRes.headers.get('set-cookie')!;

            const searchRes = await app.handle(
                new Request('http://localhost/contact/search?q=taro', {
                    headers: { Cookie: cookieHeader },
                })
            );
            const searchHtml = await searchRes.text();
            expect(searchRes.status).toBe(200);
            expect(searchHtml).toContain('taro_1');

            const inviteRes = await app.handle(
                new Request(`http://localhost/contact/invite/${userA.id}`, {
                    headers: { Cookie: cookieHeader },
                })
            );
            const inviteHtml = await inviteRes.text();
            expect(inviteRes.status).toBe(200);
            expect(inviteHtml).toContain('taro_1');
            expect(inviteHtml).toContain('Kirim Permintaan Pertemanan');
        });

        it('mengunggah file gambar ke room dan menolak akses file oleh non-anggota (Anti-IDOR)', async () => {
            const userA = await authService.register({ username: 'up_a', password: 'password123' });
            const userB = await authService.register({ username: 'up_b', password: 'password123' });
            await authService.register({ username: 'up_eve', password: 'password123' });

            const roomId = await chatService.getOrCreateDirectRoom(userA.id, userB.id);
            const app = createApp();

            const loginA = await app.handle(
                new Request('http://localhost/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'up_a', password: 'password123' }),
                })
            );
            const cookieA = loginA.headers.get('set-cookie')!;

            const loginEve = await app.handle(
                new Request('http://localhost/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'up_eve', password: 'password123' }),
                })
            );
            const cookieEve = loginEve.headers.get('set-cookie')!;

            const form = new FormData();
            form.append('file', new File(['fake-png-data'], 'foto.png', { type: 'image/png' }));

            const uploadRes = await app.handle(
                new Request(`http://localhost/room/${roomId}/upload`, {
                    method: 'POST',
                    headers: { Cookie: cookieA },
                    body: form,
                })
            );
            expect(uploadRes.status).toBe(204);

            const history = await chatService.getRoomHistory(roomId, 5);
            expect(history[0].type).toBe('image');
            expect(history[0].attachmentUrl).toMatch(/^\/uploads\/[a-f0-9-]+\.png$/);

            const memberDownload = await app.handle(
                new Request(`http://localhost${history[0].attachmentUrl}`, {
                    headers: { Cookie: cookieA },
                })
            );
            expect(memberDownload.status).toBe(200);

            const eveDownload = await app.handle(
                new Request(`http://localhost${history[0].attachmentUrl}`, {
                    headers: { Cookie: cookieEve },
                })
            );
            expect(eveDownload.status).toBe(403);
        });
    });
});
