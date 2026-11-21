import { basename } from 'node:path';
import { Elysia } from 'elysia';
import { logger } from '../../../shared/logger';
import { storage } from '../../../shared/storage';
import { ModalAlert } from '../../../shared/components/modal-alert';
import { ChatServiceError } from '../errors';
import { contactService } from '../services/contact.service';
import { messageService } from '../services/message.service';
import { roomService } from '../services/room.service';
import {
    createGroupBodySchema,
    directRoomBodySchema,
    groupMemberBodySchema,
    groupMemberParamsSchema,
    messagesQuerySchema,
    roomParamsSchema,
    uploadFilenameParamsSchema,
    type MessageType,
} from '../model';
import {
    ChatPage,
    ChatPanel,
    Chats,
    GroupMembersModalContent,
} from '../views';
import { broadcastMessageToRoom, getOnlineUserIds } from '../presence';
import { chatSessionPlugin } from '../session';

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

export const roomRoutes = new Elysia()
    .use(chatSessionPlugin)
    .get('/', async ({ redirect, user }) => {
        try {
            if (!user) return redirect('/auth/login');
            const onlineIds = getOnlineUserIds();
            const [userRooms, availableUsers] = await Promise.all([
                roomService.getUserRooms(user.id, onlineIds),
                contactService.getContacts(user.id),
            ]);
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
                await roomService.getOrCreateDirectRoom(user.id, targetUserId);
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
                await roomService.createGroupRoom(user.id, body.name, memberIds);
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
                    roomService.getGroupDetails(roomId, user.id),
                    contactService.getContacts(user.id),
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
                await roomService.addGroupMember(roomId, user.id, body.userId);
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
                await roomService.removeGroupMember(roomId, user.id, userId);
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

            const isMember = await roomService.isUserInRoom(user.id, roomId);
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

            await roomService.markRoomAsRead(roomId, user.id);
            const [initialMessages, roomInfo] = await Promise.all([
                messageService.getRoomHistory(roomId, 10),
                roomService.getRoomAndOpponent(roomId, user.id, getOnlineUserIds()),
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
                    opponentAvatarUrl: roomInfo?.opponentAvatarUrl ?? null,
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
            const isMember = await roomService.isUserInRoom(user.id, roomId);
            if (!isMember) {
                set.status = 403;
                return '';
            }
            await roomService.markRoomAsRead(roomId, user.id);
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

            const canSend = await messageService.canSendMessageInRoom(user.id, roomId);
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

                const storedFilename = `${crypto.randomUUID()}.${mimeRule.ext}`;
                await storage.upload(`uploads/${storedFilename}`, file);

                const safeOriginalName =
                    file.name.replace(/[^\w.\-\s]/g, '_').slice(0, 100) || storedFilename;
                const attachmentUrl = `/uploads/${storedFilename}`;

                const created = await messageService.createMessage({
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
            const allowed = await messageService.canAccessUpload(user.id, attachmentUrl);
            if (!allowed) {
                set.status = 403;
                return 'Akses ditolak';
            }

            const safeName = basename(filename);
            const response = await storage.getResponse(`uploads/${safeName}`);
            if (!response) {
                set.status = 404;
                return 'File tidak ditemukan';
            }

            return response;
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

                const isMember = await roomService.isUserInRoom(user.id, roomId);
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

                const msgs = await messageService.getPreviousMessages(roomId, beforeDate, 10);
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
    );
