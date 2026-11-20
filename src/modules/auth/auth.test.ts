import { describe, it, expect, beforeEach } from 'bun:test';
import { db, sessionsTable, usersTable } from '../../shared/db';
import { createApp } from '../../app';
import { loginBodySchema, registerBodySchema } from './model';
import { authService, AuthError } from './service';

describe('Auth Module', () => {
    beforeEach(async () => {
        await db.delete(sessionsTable);
        await db.delete(usersTable);
    });

    describe('Zod Validation', () => {
        it('menerima input registrasi yang valid', () => {
            const result = registerBodySchema.safeParse({
                username: 'budi_123',
                password: 'password123',
            });
            expect(result.success).toBe(true);
        });

        it('menolak username kurang dari 3 karakter dengan pesan Indonesia', () => {
            const result = registerBodySchema.safeParse({
                username: 'ab',
                password: 'password123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Username minimal 3 karakter');
            }
        });

        it('menolak password kurang dari 6 karakter dengan pesan Indonesia', () => {
            const result = registerBodySchema.safeParse({
                username: 'budi_123',
                password: '123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Kata sandi minimal 6 karakter');
            }
        });

        it('menolak login dengan username kosong', () => {
            const result = loginBodySchema.safeParse({
                username: '   ',
                password: 'password123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Username wajib diisi');
            }
        });
    });

    describe('AuthService', () => {
        it('dapat mendaftarkan user baru dan menolak username duplikat', async () => {
            const user = await authService.register({
                username: 'andi_dev',
                password: 'rahasia123',
            });

            expect(user.username).toBe('andi_dev');
            expect(user.id).toHaveLength(6);
            expect(user.passwordHash).not.toBe('rahasia123');

            await expect(
                authService.register({
                    username: 'andi_dev',
                    password: 'rahasia123',
                })
            ).rejects.toThrow(AuthError);
        });

        it('dapat login, memvalidasi session, dan logout', async () => {
            const user = await authService.register({
                username: 'siti_chat',
                password: 'password123',
            });

            const session = await authService.login({
                username: 'siti_chat',
                password: 'password123',
            });

            const validated = await authService.validateSession(session.id);
            expect(validated?.id).toBe(user.id);
            expect(validated?.username).toBe('siti_chat');

            await authService.logout(session.id);
            const afterLogout = await authService.validateSession(session.id);
            expect(afterLogout).toBeNull();
        });
    });

    describe('Auth Routes', () => {
        it('GET /auth/login merender halaman masuk berbahasa Indonesia', async () => {
            const app = createApp();
            const res = await app.handle(new Request('http://localhost/auth/login'));
            const html = await res.text();

            expect(res.status).toBe(200);
            expect(html).toContain('<title>Masuk | Chatify</title>');
        });

        it('POST /auth/register dan POST /auth/login mengatur cookie dan HX-Redirect', async () => {
            const app = createApp();

            const registerRes = await app.handle(
                new Request('http://localhost/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'rina_user', password: 'password123' }),
                })
            );
            expect(registerRes.status).toBe(200);
            expect(registerRes.headers.get('HX-Redirect')).toBe('/auth/login');

            const loginRes = await app.handle(
                new Request('http://localhost/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'rina_user', password: 'password123' }),
                })
            );
            expect(loginRes.status).toBe(200);
            expect(loginRes.headers.get('HX-Redirect')).toBe('/');
            expect(loginRes.headers.get('set-cookie')).toContain('session=');
        });

        it('POST /profile/avatar, GET /avatars/:filename, dan DELETE /profile/avatar mengelola foto profil dengan aman', async () => {
            const app = createApp();

            await app.handle(
                new Request('http://localhost/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'avatar_user', password: 'password123' }),
                })
            );

            const loginRes = await app.handle(
                new Request('http://localhost/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'avatar_user', password: 'password123' }),
                })
            );
            const setCookie = loginRes.headers.get('set-cookie') ?? '';
            const sessionCookie = setCookie.split(';')[0];

            // Tolak format non-gambar
            const badForm = new FormData();
            badForm.append('avatar', new File(['hello'], 'doc.txt', { type: 'text/plain' }));
            const badRes = await app.handle(
                new Request('http://localhost/profile/avatar', {
                    method: 'POST',
                    headers: { Cookie: sessionCookie },
                    body: badForm,
                })
            );
            expect(badRes.status).toBe(400);
            expect(await badRes.text()).toContain('Format foto tidak didukung');

            // Unggah PNG valid
            const goodForm = new FormData();
            goodForm.append(
                'avatar',
                new File([new Uint8Array([137, 80, 78, 71])], 'avatar.png', { type: 'image/png' })
            );
            const uploadRes = await app.handle(
                new Request('http://localhost/profile/avatar', {
                    method: 'POST',
                    headers: { Cookie: sessionCookie },
                    body: goodForm,
                })
            );
            expect(uploadRes.status).toBe(200);
            expect(uploadRes.headers.get('HX-Refresh')).toBe('true');

            // Profil menampilkan <img src="/avatars/...">
            const profileRes = await app.handle(
                new Request('http://localhost/profile', {
                    headers: { Cookie: sessionCookie },
                })
            );
            const profileHtml = await profileRes.text();
            const match = profileHtml.match(/\/avatars\/[a-zA-Z0-9_-]+\.png/);
            expect(match).not.toBeNull();

            // Endpoint /avatars/:filename dapat diakses
            const avatarRes = await app.handle(new Request(`http://localhost${match![0]}`));
            expect(avatarRes.status).toBe(200);

            // Hapus foto profil
            const deleteRes = await app.handle(
                new Request('http://localhost/profile/avatar', {
                    method: 'DELETE',
                    headers: { Cookie: sessionCookie },
                })
            );
            expect(deleteRes.status).toBe(200);
            expect(deleteRes.headers.get('HX-Refresh')).toBe('true');
        });
    });
});
