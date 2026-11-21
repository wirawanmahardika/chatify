import { Elysia } from 'elysia';
import { basename } from 'path';
import { logger } from '../../../shared/logger';
import { storage } from '../../../shared/storage';
import { ModalAlert } from '../../../shared/components/modal-alert';
import { authService } from '../service';
import { avatarFilenameParamsSchema } from '../model';
import { ProfilePage } from '../views';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
};

async function removeOldAvatarFile(avatarUrl?: string | null) {
    if (!avatarUrl || !avatarUrl.startsWith('/avatars/')) return;
    const oldFilename = basename(avatarUrl);
    if (!oldFilename) return;
    await storage.remove(`avatars/${oldFilename}`);
}

export const profileRoutes = new Elysia()
    .get('/profile', async ({ redirect, cookie: { session } }) => {
        if (!session.value) {
            session.remove();
            return redirect('/auth/login');
        }
        const user = await authService.validateSession(session.value as string);
        if (!user) {
            session.remove();
            return redirect('/auth/login');
        }
        return ProfilePage({ user });
    })
    .post('/profile/avatar', async ({ request, set, cookie: { session } }) => {
        if (!session.value) {
            set.status = 401;
            return ModalAlert({ status: 'error', msg: 'Silakan masuk terlebih dahulu' });
        }

        const user = await authService.validateSession(session.value as string);
        if (!user) {
            session.remove();
            set.status = 401;
            return ModalAlert({ status: 'error', msg: 'Sesi tidak valid, silakan masuk ulang' });
        }

        try {
            const formData = await request.formData();
            const file = formData.get('avatar');
            if (!(file instanceof File)) {
                set.status = 400;
                return ModalAlert({ status: 'error', msg: 'File foto profil wajib dipilih' });
            }

            if (file.size <= 0 || file.size > MAX_AVATAR_BYTES) {
                set.status = 400;
                return ModalAlert({
                    status: 'error',
                    msg: 'Ukuran foto profil maksimal 2 MB',
                });
            }

            const ext = ALLOWED_AVATAR_MIME[file.type];
            if (!ext) {
                set.status = 400;
                return ModalAlert({
                    status: 'error',
                    msg: 'Format foto tidak didukung (gunakan JPG, PNG, GIF, atau WEBP)',
                });
            }

            const storedFilename = `avatar-${user.id}-${crypto.randomUUID()}.${ext}`;
            await storage.upload(`avatars/${storedFilename}`, file);

            const avatarUrl = `/avatars/${storedFilename}`;
            await authService.updateAvatar(user.id, avatarUrl);
            await removeOldAvatarFile(user.avatarUrl);

            set.headers['HX-Refresh'] = 'true';
            return ModalAlert({ status: 'success', msg: 'Foto profil berhasil diperbarui' });
        } catch (error) {
            logger.error('Gagal mengunggah foto profil', { module: 'auth', userId: user.id, error });
            set.status = 500;
            return ModalAlert({ status: 'error', msg: 'Gagal mengunggah foto profil' });
        }
    })
    .delete('/profile/avatar', async ({ set, cookie: { session } }) => {
        if (!session.value) {
            set.status = 401;
            return ModalAlert({ status: 'error', msg: 'Silakan masuk terlebih dahulu' });
        }

        const user = await authService.validateSession(session.value as string);
        if (!user) {
            session.remove();
            set.status = 401;
            return ModalAlert({ status: 'error', msg: 'Sesi tidak valid, silakan masuk ulang' });
        }

        try {
            await authService.updateAvatar(user.id, null);
            await removeOldAvatarFile(user.avatarUrl);
            set.headers['HX-Refresh'] = 'true';
            return ModalAlert({ status: 'success', msg: 'Foto profil berhasil dihapus' });
        } catch (error) {
            logger.error('Gagal menghapus foto profil', { module: 'auth', userId: user.id, error });
            set.status = 500;
            return ModalAlert({ status: 'error', msg: 'Gagal menghapus foto profil' });
        }
    })
    .get(
        '/avatars/:filename',
        async ({ params: { filename }, set }) => {
            const safeName = basename(filename);
            const response = await storage.getResponse(`avatars/${safeName}`, {
                cacheControl: 'public, max-age=86400',
            });
            if (!response) {
                set.status = 404;
                return 'Avatar tidak ditemukan';
            }
            return response;
        },
        { params: avatarFilenameParamsSchema }
    );
