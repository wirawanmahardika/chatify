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
    });
});
