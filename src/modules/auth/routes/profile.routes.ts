import { Elysia } from 'elysia';
import { mkdirSync, unlinkSync } from 'fs';
import { basename, join } from 'path';
import { logger } from '../../../shared/logger';
import { ModalAlert } from '../../../shared/components/modal-alert';
import { authService } from '../service';
import { avatarFilenameParamsSchema } from '../model';
import { ProfilePage } from '../views';

const AVATAR_UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
};

function removeOldAvatarFile(avatarUrl?: string | null) {
    if (!avatarUrl || !avatarUrl.startsWith('/avatars/')) return;
    const oldFilename = basename(avatarUrl);
    if (!oldFilename) return;
    try {
        unlinkSync(join(AVATAR_UPLOAD_DIR, oldFilename));
    } catch {
        // Ignore if file already missing
    }
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

            mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
            const storedFilename = `avatar-${user.id}-${crypto.randomUUID()}.${ext}`;
            const filePath = join(AVATAR_UPLOAD_DIR, storedFilename);
            await Bun.write(filePath, file);

            const avatarUrl = `/avatars/${storedFilename}`;
            await authService.updateAvatar(user.id, avatarUrl);
            removeOldAvatarFile(user.avatarUrl);

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
            removeOldAvatarFile(user.avatarUrl);
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
            const filePath = join(AVATAR_UPLOAD_DIR, safeName);
            const file = Bun.file(filePath);
            if (!(await file.exists())) {
                set.status = 404;
                return 'Avatar tidak ditemukan';
            }
            set.headers['Cache-Control'] = 'public, max-age=86400';
            return file;
        },
        { params: avatarFilenameParamsSchema }
    );
