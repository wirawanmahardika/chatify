import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Elysia } from 'elysia';
import { logger } from '../../shared/logger';
import { ModalAlert } from '../../shared/components/modal-alert';
import { authService } from '../auth/service';
import type { User } from '../auth/model';
import { chatService, ChatServiceError } from './service';
import {
    addFriendshipBodySchema,
    blockUserBodySchema,
    createGroupBodySchema,
    directRoomBodySchema,
    groupMemberBodySchema,
    groupMemberParamsSchema,
    messagesQuerySchema,
    roomParamsSchema,
    searchUserQuerySchema,
    updateStatusFriendshipSchema,
    uploadFilenameParamsSchema,
    userIdParamsSchema,
    wsIncomingMessageSchema,
    type MessageType,
} from './model';
import {
    ChatPage,
    ChatPanel,
    ChatPartial,
    Chats,
    ContactList,
    ContactsPage,
    GroupMembersModalContent,
    InvitePage,
    PresencePartial,
    SearchUserResults,
    TypingPartial,
} from './views';

interface WSClientState {
    ws: { send: (data: string) => unknown };
    user: User;
    subscribedRooms: Set<string>;
}

const states = new Map<string, WSClientState>();
const onlineUsers = new Map<string, Set<string>>();
const UPLOAD_DIR = join(process.cwd(), 'storage', 'uploads');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_UPLOAD_MIME: Record<string, { ext: string; type: MessageType }> = {
    'image/jpeg': { ext: 'jpg', type: 'image' },
    'image/png': { ext: 'png', type: 'image' },
    'image/gif': { ext: 'gif', type: 'image' },
    'image/webp': { ext: 'webp', type: 'image' },
    'application/pdf': { ext: 'pdf', type: 'file' },
    'text/plain': { ext: 'txt', type: 'file' },
    'application/zip': { ext: 'zip', type: 'file' },
    'application/x-zip-compressed': { ext: 'zip', type: 'file' },
};

function getOnlineUserIds(): Set<string> {
    return new Set(onlineUsers.keys());
}

async function broadcastMessageToRoom(params: {
    roomId: string;
    senderId: string;
    senderUsername: string;
    content: string;
    type: MessageType;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    createdAt: Date;
}) {
    for (const client of states.values()) {
        if (!client.subscribedRooms.has(params.roomId)) continue;
        const isSelf = client.user.id === params.senderId;
        const html = await ChatPartial({
            isSelf,
            username: params.senderUsername,
            content: params.content,
            roomId: params.roomId,
            createdAt: params.createdAt,
            type: params.type,
            attachmentUrl: params.attachmentUrl,
            attachmentName: params.attachmentName,
        });
        client.ws.send(html);
    }
}

export const chatModule = new Elysia()
    .resolve(async ({ cookie: { session } }) => {
        if (!session.value) {
            session.remove();
            return { user: null };
        }
        const user = await authService.validateSession(session.value as string);
        if (!user) {
            session.remove();
            return { user: null };
        }
        return { user };
    })
    .get('/', async ({ redirect, user }) => {
        try {
            if (!user) return redirect('/auth/login');
            const onlineIds = getOnlineUserIds();
            const userRooms = await chatService.getUserRooms(user.id, onlineIds);
            const availableUsers = await chatService.getContacts(user.id);
            return ChatPage({
                user,
                userRooms,
                availableUsers,
            });
        } catch (error) {
            logger.error('Gagal memuat halaman obrolan', { module: 'chat', error });
            return new Response('Terjadi kesalahan pada server', { status: 500 });
        }
    })
    .post(
        '/direct',
        async ({ body, redirect, user, set }) => {
            if (!user) return redirect('/auth/login');

            const { targetUserId } = body;
            if (!targetUserId || targetUserId === user.id) {
                return redirect('/');
            }

            try {
                await chatService.getOrCreateDirectRoom(user.id, targetUserId);
                return redirect('/');
            } catch (error) {
                if (error instanceof ChatServiceError) {
                    set.status = 403;
                    return error.message;
                }
                logger.error('Gagal membuka ruang obrolan langsung', {
                    module: 'chat',
                    userId: user.id,
                    error,
                });
                return new Response('Terjadi kesalahan pada server', { status: 500 });
            }
        },
        {
            body: directRoomBodySchema,
        }
    )
    .post(
        '/group',
        async ({ body, redirect, user, set }) => {
            if (!user) return redirect('/auth/login');

            try {
                const rawMembers = body.memberIds;
                const memberIds = Array.isArray(rawMembers)
                    ? rawMembers
                    : rawMembers
                      ? [rawMembers]
                      : [];
                await chatService.createGroupRoom(user.id, body.name, memberIds);
                return redirect('/');
            } catch (error) {
                logger.error('Gagal membuat grup baru', { module: 'chat', userId: user.id, error });
                set.status = 500;
                return 'Terjadi kesalahan saat membuat grup';
            }
        },
        {
            body: createGroupBodySchema,
        }
    )
    .get(
        '/group/:roomId/members',
        async ({ params: { roomId }, user, set }) => {
            if (!user) {
                set.status = 401;
                return '';
            }
            try {
                const [details, contacts] = await Promise.all([
                    chatService.getGroupDetails(roomId, user.id),
                    chatService.getContacts(user.id),
                ]);
                const existingIds = new Set(details.members.map((m) => m.userId));
                const addableContacts = contacts.filter((c) => !existingIds.has(c.id));

                return GroupMembersModalContent({
                    roomId,
                    roomName: details.room.name || 'Grup',
                    members: details.members,
                    currentUserId: user.id,
                    currentUserRole: details.currentUserRole,
                    addableContacts,
                });
            } catch (error) {
                if (error instanceof ChatServiceError) {
                    set.status = 403;
                    return ModalAlert({ status: 'error', msg: error.message });
                }
                logger.error('Gagal memuat anggota grup', { module: 'chat', roomId, error });
                set.status = 500;
                return ModalAlert({ status: 'error', msg: 'Terjadi kesalahan pada server' });
            }
        },
        { params: roomParamsSchema }
    )
    .post(
        '/group/:roomId/members',
        async ({ params: { roomId }, body, user, set }) => {
            if (!user) {
                set.status = 401;
                return '';
            }
            try {
                await chatService.addGroupMember(roomId, user.id, body.userId);
                set.headers['HX-Refresh'] = 'true';
                return ModalAlert({ status: 'success', msg: 'Anggota berhasil ditambahkan' });
            } catch (error) {
                if (error instanceof ChatServiceError) {
                    set.status = 403;
                    return ModalAlert({ status: 'error', msg: error.message });
                }
                logger.error('Gagal menambah anggota grup', { module: 'chat', roomId, error });
                set.status = 500;
                return ModalAlert({ status: 'error', msg: 'Terjadi kesalahan pada server' });
            }
        },
        { params: roomParamsSchema, body: groupMemberBodySchema }
    )
    .delete(
        '/group/:roomId/members/:userId',
        async ({ params: { roomId, userId }, user, set }) => {
            if (!user) {
                set.status = 401;
                return '';
            }
            try {
                await chatService.removeGroupMember(roomId, user.id, userId);
                set.headers['HX-Refresh'] = 'true';
                return new Response(null, { status: 200 });
            } catch (error) {
                if (error instanceof ChatServiceError) {
                    set.status = 403;
                    return ModalAlert({ status: 'error', msg: error.message });
                }
                logger.error('Gagal mengeluarkan anggota grup', { module: 'chat', roomId, error });
                set.status = 500;
                return new Response('Terjadi kesalahan pada server', { status: 500 });
            }
        },
        { params: groupMemberParamsSchema }
    )
    .get('/room/:roomId', async ({ params: { roomId }, set, user }) => {
        try {
            if (!user) {
                set.headers['HX-Redirect'] = '/auth/login';
                return '';
            }

            const isMember = await chatService.isUserInRoom(user.id, roomId);
            if (!isMember) {
                logger.warn('Akses ditolak ke ruang obrolan', {
                    module: 'chat',
                    userId: user.id,
                    roomId,
                });
                set.status = 403;
                set.headers['HX-Redirect'] = '/';
                return '';
            }

            await chatService.markRoomAsRead(roomId, user.id);
            const [initialMessages, roomInfo] = await Promise.all([
                chatService.getRoomHistory(roomId, 10),
                chatService.getRoomAndOpponent(roomId, user.id, getOnlineUserIds()),
            ]);

            return ChatPanel({
                messages: initialMessages,
                username: user.username,
                room: {
                    id: roomInfo?.id || roomId,
                    name: roomInfo?.name || '',
                    type: roomInfo?.type || 'direct',
                    opponentId: roomInfo?.opponentId || '',
                    opponentName: roomInfo?.opponentName || '',
                    isOpponentOnline: roomInfo?.isOpponentOnline || false,
                    memberCount: roomInfo?.memberCount || 2,
                },
            });
        } catch (error) {
            logger.error('Gagal memuat ruang obrolan', { module: 'chat', roomId, error });
            return new Response('Terjadi kesalahan pada server', { status: 500 });
        }
    })
    .post(
        '/room/:roomId/read',
        async ({ params: { roomId }, user, set }) => {
            if (!user) {
                set.status = 401;
                return '';
            }
            const isMember = await chatService.isUserInRoom(user.id, roomId);
            if (!isMember) {
                set.status = 403;
                return '';
            }
            await chatService.markRoomAsRead(roomId, user.id);
            return new Response(null, { status: 204 });
        },
        { params: roomParamsSchema }
    )
    .post(
        '/room/:roomId/upload',
        async ({ params: { roomId }, request, user, set }) => {
            if (!user) {
                set.status = 401;
                return ModalAlert({ status: 'error', msg: 'Silakan masuk terlebih dahulu' });
            }

            const canSend = await chatService.canSendMessageInRoom(user.id, roomId);
            if (!canSend) {
                set.status = 403;
                return ModalAlert({
                    status: 'error',
                    msg: 'Anda tidak memiliki izin mengirim lampiran di ruang ini',
                });
            }

            try {
                const formData = await request.formData();
                const file = formData.get('file');
                if (!(file instanceof File)) {
                    set.status = 400;
                    return ModalAlert({ status: 'error', msg: 'File wajib dipilih' });
                }

                if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
                    set.status = 400;
                    return ModalAlert({
                        status: 'error',
                        msg: 'Ukuran file maksimal 5 MB',
                    });
                }

                const mimeRule = ALLOWED_UPLOAD_MIME[file.type];
                if (!mimeRule) {
                    set.status = 400;
                    return ModalAlert({
                        status: 'error',
                        msg: 'Format file tidak didukung (gunakan JPG, PNG, GIF, WEBP, PDF, TXT, atau ZIP)',
                    });
                }

                mkdirSync(UPLOAD_DIR, { recursive: true });
                const storedFilename = `${crypto.randomUUID()}.${mimeRule.ext}`;
                const filePath = join(UPLOAD_DIR, storedFilename);
                await Bun.write(filePath, file);

                const safeOriginalName =
                    file.name.replace(/[^\w.\-\s]/g, '_').slice(0, 100) || storedFilename;
                const attachmentUrl = `/uploads/${storedFilename}`;

                const created = await chatService.createMessage({
                    roomId,
                    userId: user.id,
                    type: mimeRule.type,
                    content: safeOriginalName,
                    attachmentUrl,
                    attachmentName: safeOriginalName,
                });

                await broadcastMessageToRoom({
                    roomId,
                    senderId: user.id,
                    senderUsername: user.username,
                    content: created.content,
                    type: created.type,
                    attachmentUrl: created.attachmentUrl,
                    attachmentName: created.attachmentName,
                    createdAt: created.createdAt,
                });

                return new Response(null, { status: 204 });
            } catch (error) {
                logger.error('Gagal mengunggah file', { module: 'chat', roomId, error });
                set.status = 500;
                return ModalAlert({ status: 'error', msg: 'Gagal mengunggah file' });
            }
        },
        { params: roomParamsSchema }
    )
    .get(
        '/uploads/:filename',
        async ({ params: { filename }, user, set }) => {
            if (!user) {
                set.status = 401;
                return 'Silakan masuk terlebih dahulu';
            }

            const attachmentUrl = `/uploads/${filename}`;
            const allowed = await chatService.canAccessUpload(user.id, attachmentUrl);
            if (!allowed) {
                set.status = 403;
                return 'Akses ditolak';
            }

            const file = Bun.file(join(UPLOAD_DIR, filename));
            if (!(await file.exists())) {
                set.status = 404;
                return 'File tidak ditemukan';
            }

            return file;
        },
        { params: uploadFilenameParamsSchema }
    )
    .get(
        '/messages/:roomId',
        async ({ params: { roomId }, query: { beforeDate }, set, user }) => {
            try {
                if (!user) {
                    set.headers['HX-Redirect'] = '/auth/login';
                    return '';
                }

                const isMember = await chatService.isUserInRoom(user.id, roomId);
                if (!isMember) {
                    logger.warn('Percobaan akses riwayat pesan tanpa otorisasi', {
                        module: 'chat',
                        userId: user.id,
                        roomId,
                    });
                    set.status = 403;
                    return 'Akses ditolak';
                }

                if (!beforeDate) {
                    set.headers['HX-Retarget'] = '#message-loader-btn';
                    set.headers['HX-Reswap'] = 'innerHTML';
                    return 'Tidak ada lagi pesan';
                }

                const msgs = await chatService.getPreviousMessages(roomId, beforeDate, 10);
                if (msgs.length <= 0) {
                    set.headers['HX-Retarget'] = '#message-loader-btn';
                    set.headers['HX-Reswap'] = 'innerHTML';
                    return 'Tidak ada lagi pesan';
                }
                return Chats(user.id, msgs);
            } catch (error) {
                logger.error('Gagal memuat pesan sebelumnya', { module: 'chat', roomId, error });
                return new Response('Terjadi kesalahan pada server', { status: 500 });
            }
        },
        {
            params: roomParamsSchema,
            query: messagesQuerySchema,
        }
    )
    .get('/contact', async ({ user, redirect }) => {
        try {
            if (!user) return redirect('/auth/login');
            const [friendships, blockedUsers] = await Promise.all([
                chatService.getFriendship(user.id),
                chatService.getBlockedUsers(user.id),
            ]);

            return ContactsPage({
                user,
                contacts: friendships.filter((f) => f.status === 'accepted'),
                incomingRequests: friendships.filter(
                    (f) => f.status === 'pending' && f.direction === 'incoming'
                ),
                outgoingRequests: friendships.filter(
                    (f) => f.status === 'pending' && f.direction === 'outgoing'
                ),
                blockedUsers,
            });
        } catch (error) {
            logger.error('Gagal memuat halaman kontak', { module: 'chat', error });
            return new Response('Terjadi kesalahan pada server', { status: 500 });
        }
    })
    .get(
        '/contact/search',
        async ({ query: { q }, user, set }) => {
            if (!user) {
                set.status = 401;
                return '';
            }
            if (!q) {
                return SearchUserResults({
                    results: [],
                    hint: 'Ketik minimal 3 karakter username atau ID 6 digit.',
                });
            }

            try {
                const results = await chatService.searchUsers(user.id, q);
                return SearchUserResults({ results });
            } catch (error) {
                if (error instanceof ChatServiceError) {
                    return SearchUserResults({ results: [], hint: error.message });
                }
                logger.error('Gagal mencari pengguna', { module: 'chat', userId: user.id, error });
                return SearchUserResults({
                    results: [],
                    hint: 'Terjadi kesalahan saat mencari pengguna',
                });
            }
        },
        { query: searchUserQuerySchema }
    )
    .get(
        '/contact/invite/:id',
        async ({ params: { id }, user, redirect }) => {
            if (!user) return redirect('/auth/login');
            const preview = await chatService.getInvitePreview(user.id, id);
            return InvitePage({ user, target: preview, isSelf: user.id === id });
        },
        { params: userIdParamsSchema }
    )
    .get('/contacts', async ({ user }) => {
        if (!user) return new Response('Tidak memiliki akses', { status: 403 });
        const friendships = await chatService.getFriendship(user.id);
        return ContactList({ contacts: friendships.filter((c) => c.status === 'accepted') });
    })
    .post(
        '/contact',
        async ({ body, user, redirect }) => {
            try {
                if (!user) return redirect('/auth/login');
                await chatService.addFriendship(user.id, body.id);
                return ModalAlert({
                    status: 'success',
                    msg: 'Berhasil mengirim permintaan pertemanan, mohon tunggu konfirmasi penerima',
                });
            } catch (error) {
                if (error instanceof ChatServiceError) {
                    return ModalAlert({ status: 'error', msg: error.message });
                }
                logger.error('Gagal mengirim permintaan pertemanan', {
                    module: 'chat',
                    userId: user?.id,
                    error,
                });
                return ModalAlert({ status: 'error', msg: 'Terjadi kesalahan pada server' });
            }
        },
        {
            body: addFriendshipBodySchema,
            error({ code, error, set }) {
                if (code === 'VALIDATION') {
                    set.status = 422;
                    return ModalAlert({
                        status: 'error',
                        msg: error.message || 'ID pengguna tidak valid',
                    });
                }
            },
        }
    )
    .patch(
        '/contact',
        async ({ body, user, set, redirect }) => {
            try {
                if (!user) return redirect('/auth/login');
                await chatService.updateStatusFriendship(user.id, body.id, body.status);
                set.headers['HX-Refresh'] = 'true';
                return new Response(null, { status: 200 });
            } catch (error) {
                if (error instanceof ChatServiceError) {
                    set.status = 404;
                    return ModalAlert({ status: 'error', msg: error.message });
                }
                logger.error('Gagal memperbarui status pertemanan', {
                    module: 'chat',
                    userId: user?.id,
                    error,
                });
                return new Response('Terjadi kesalahan pada server', { status: 500 });
            }
        },
        { body: updateStatusFriendshipSchema }
    )
    .delete(
        '/contact/:id',
        async ({ params: { id }, user, set, redirect }) => {
            try {
                if (!user) return redirect('/auth/login');
                await chatService.cancelFriendRequest(user.id, id);
                set.headers['HX-Refresh'] = 'true';
                return new Response(null, { status: 200 });
            } catch (error) {
                if (error instanceof ChatServiceError) {
                    set.status = 404;
                    return ModalAlert({ status: 'error', msg: error.message });
                }
                logger.error('Gagal membatalkan permintaan pertemanan', {
                    module: 'chat',
                    userId: user?.id,
                    error,
                });
                return new Response('Terjadi kesalahan pada server', { status: 500 });
            }
        },
        { params: userIdParamsSchema }
    )
    .post(
        '/contact/block',
        async ({ body, user, set, redirect }) => {
            try {
                if (!user) return redirect('/auth/login');
                await chatService.blockUser(user.id, body.id);
                set.headers['HX-Refresh'] = 'true';
                return new Response(null, { status: 200 });
            } catch (error) {
                if (error instanceof ChatServiceError) {
                    set.status = 400;
                    return ModalAlert({ status: 'error', msg: error.message });
                }
                logger.error('Gagal memblokir pengguna', {
                    module: 'chat',
                    userId: user?.id,
                    error,
                });
                return new Response('Terjadi kesalahan pada server', { status: 500 });
            }
        },
        { body: blockUserBodySchema }
    )
    .delete(
        '/contact/block/:id',
        async ({ params: { id }, user, set, redirect }) => {
            try {
                if (!user) return redirect('/auth/login');
                await chatService.unblockUser(user.id, id);
                set.headers['HX-Refresh'] = 'true';
                return new Response(null, { status: 200 });
            } catch (error) {
                if (error instanceof ChatServiceError) {
                    set.status = 403;
                    return ModalAlert({ status: 'error', msg: error.message });
                }
                logger.error('Gagal membuka blokir pengguna', {
                    module: 'chat',
                    userId: user?.id,
                    error,
                });
                return new Response('Terjadi kesalahan pada server', { status: 500 });
            }
        },
        { params: userIdParamsSchema }
    )
    .ws('/ws', {
        async open(ws) {
            const user = ws.data.user;
            if (!user) {
                ws.close();
                return;
            }

            const userRooms = await chatService.getUserRooms(user.id);
            const subscribedRooms = new Set<string>();
            for (const room of userRooms) {
                ws.subscribe(room.id);
                subscribedRooms.add(room.id);
            }

            states.set(ws.id, {
                ws,
                user,
                subscribedRooms,
            });

            const sockets = onlineUsers.get(user.id) ?? new Set<string>();
            const wasOffline = sockets.size === 0;
            sockets.add(ws.id);
            onlineUsers.set(user.id, sockets);

            if (wasOffline) {
                const html = PresencePartial(user.id, true);
                for (const roomId of subscribedRooms) {
                    ws.publish(roomId, html);
                }
            }
        },
        async message(ws, data) {
            const clientState = states.get(ws.id);
            if (!clientState) return;

            const parsed = wsIncomingMessageSchema.safeParse(data);
            if (!parsed.success) {
                logger.warn('Payload WebSocket tidak valid', {
                    module: 'chat',
                    userId: clientState.user.id,
                });
                return;
            }

            const payload = parsed.data;
            switch (payload.type) {
                case 'chatting': {
                    const { roomId, message } = payload;
                    const user = clientState.user;

                    const canSend = await chatService.canSendMessageInRoom(user.id, roomId);
                    if (!canSend) {
                        logger.warn('Pesan ditolak: bukan anggota atau pengguna diblokir', {
                            module: 'chat',
                            userId: user.id,
                            roomId,
                        });
                        return;
                    }

                    if (!clientState.subscribedRooms.has(roomId)) {
                        ws.subscribe(roomId);
                        clientState.subscribedRooms.add(roomId);
                    }

                    const created = await chatService.createMessage({
                        roomId,
                        userId: user.id,
                        content: message,
                    });

                    const response = ChatPartial({
                        isSelf: false,
                        username: user.username,
                        content: message,
                        roomId,
                        createdAt: created.createdAt,
                        type: 'text',
                    });
                    ws.publish(roomId, response);

                    const selfResponse = ChatPartial({
                        isSelf: true,
                        username: user.username,
                        content: message,
                        roomId,
                        createdAt: created.createdAt,
                        type: 'text',
                    });
                    ws.send(selfResponse);
                    break;
                }
                case 'typing': {
                    const { roomId, isTyping } = payload;
                    const user = clientState.user;

                    const canSend = await chatService.canSendMessageInRoom(user.id, roomId);
                    if (!canSend) return;

                    ws.publish(roomId, TypingPartial(roomId, user.username, isTyping));
                    break;
                }
            }
        },
        close(ws) {
            const clientState = states.get(ws.id);
            if (clientState) {
                const { user, subscribedRooms } = clientState;
                for (const roomId of subscribedRooms) {
                    ws.unsubscribe(roomId);
                }
                states.delete(ws.id);

                const sockets = onlineUsers.get(user.id);
                if (sockets) {
                    sockets.delete(ws.id);
                    if (sockets.size === 0) {
                        onlineUsers.delete(user.id);
                        const html = PresencePartial(user.id, false);
                        for (const roomId of subscribedRooms) {
                            ws.publish(roomId, html);
                        }
                    }
                }
            }
        },
    });

export default chatModule;
