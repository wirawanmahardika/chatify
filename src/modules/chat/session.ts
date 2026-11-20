import { Elysia } from 'elysia';
import { authService } from '../auth/service';

export const chatSessionPlugin = new Elysia({ name: 'chat-session' }).resolve(
    { as: 'scoped' },
    async ({ cookie: { session } }) => {
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
    }
);
