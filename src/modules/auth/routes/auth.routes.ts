import { Elysia } from 'elysia';
import { config } from '../../../config';
import { logger } from '../../../shared/logger';
import { authService, AuthError } from '../service';
import { loginBodySchema, registerBodySchema } from '../model';
import { LoginPage, RegisterView, AuthResponseError } from '../views';

export const authRoutes = new Elysia({ prefix: '/auth' })
    .get('/login', () => LoginPage())
    .post(
        '/login',
        async ({ body, set, cookie: { session } }) => {
            try {
                const newSession = await authService.login(body);

                session.set({
                    value: newSession.id,
                    httpOnly: true,
                    sameSite: 'strict',
                    secure: config.NODE_ENV === 'production',
                    expires: newSession.expiresAt,
                    path: '/',
                });
                set.headers['HX-Redirect'] = '/';
                return '';
            } catch (error) {
                if (error instanceof AuthError) {
                    return AuthResponseError(error.message);
                }
                logger.error('Kesalahan saat login', { module: 'auth', error });
                return AuthResponseError('Terjadi kesalahan pada server, silakan coba lagi');
            }
        },
        {
            body: loginBodySchema,
            error({ code, error, set }) {
                if (code === 'VALIDATION') {
                    set.status = 422;
                    return AuthResponseError(error.message || 'Data masuk tidak valid');
                }
            },
        }
    )
    .get('/register', () => RegisterView())
    .post(
        '/register',
        async ({ set, body }) => {
            try {
                await authService.register(body);
                set.headers['HX-Redirect'] = '/auth/login';
                return '';
            } catch (error) {
                if (error instanceof AuthError) {
                    return AuthResponseError(error.message);
                }
                logger.error('Kesalahan saat registrasi', { module: 'auth', error });
                return AuthResponseError('Terjadi kesalahan pada server, silakan coba lagi');
            }
        },
        {
            body: registerBodySchema,
            error({ code, error, set }) {
                if (code === 'VALIDATION') {
                    set.status = 422;
                    return AuthResponseError(error.message || 'Data pendaftaran tidak valid');
                }
            },
        }
    )
    .get('/logout', async ({ cookie: { session }, redirect }) => {
        if (session.value) {
            await authService.logout(session.value as string);
            session.remove();
        }
        return redirect('/auth/login');
    });
