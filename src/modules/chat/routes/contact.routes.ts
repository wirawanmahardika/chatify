import { Elysia } from 'elysia';
import { logger } from '../../../shared/logger';
import { ModalAlert } from '../../../shared/components/modal-alert';
import { ChatServiceError } from '../errors';
import { contactService } from '../services/contact.service';
import {
    addFriendshipBodySchema,
    blockUserBodySchema,
    searchUserQuerySchema,
    updateStatusFriendshipSchema,
    userIdParamsSchema,
} from '../model';
import {
    ContactList,
    ContactsPage,
    InvitePage,
    SearchUserResults,
} from '../views';
import { chatSessionPlugin } from '../session';

export const contactRoutes = new Elysia()
    .use(chatSessionPlugin)
    .get('/contact', async ({ user, redirect }) => {
        try {
            if (!user) return redirect('/auth/login');
            const [friendships, blockedUsers] = await Promise.all([
                contactService.getFriendship(user.id),
                contactService.getBlockedUsers(user.id),
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
                const results = await contactService.searchUsers(user.id, q);
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
            const preview = await contactService.getInvitePreview(user.id, id);
            return InvitePage({ user, target: preview, isSelf: user.id === id });
        },
        { params: userIdParamsSchema }
    )
    .get('/contacts', async ({ user }) => {
        if (!user) return new Response('Tidak memiliki akses', { status: 403 });
        const friendships = await contactService.getFriendship(user.id);
        return ContactList({ contacts: friendships.filter((c) => c.status === 'accepted') });
    })
    .post(
        '/contact',
        async ({ body, user, redirect }) => {
            try {
                if (!user) return redirect('/auth/login');
                await contactService.addFriendship(user.id, body.id);
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
                await contactService.updateStatusFriendship(user.id, body.id, body.status);
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
                await contactService.cancelFriendRequest(user.id, id);
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
                await contactService.blockUser(user.id, body.id);
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
                await contactService.unblockUser(user.id, id);
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
    );
