import { Elysia } from 'elysia';
import { authRoutes } from './routes/auth.routes';
import { profileRoutes } from './routes/profile.routes';

export const authModule = new Elysia()
    .use(authRoutes)
    .use(profileRoutes);

export default authModule;
