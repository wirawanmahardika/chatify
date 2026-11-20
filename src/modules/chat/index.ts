import { Elysia } from 'elysia';
import { contactRoutes } from './routes/contact.routes';
import { roomRoutes } from './routes/room.routes';
import { wsRoutes } from './routes/ws.routes';

export const chatModule = new Elysia()
    .use(roomRoutes)
    .use(contactRoutes)
    .use(wsRoutes);

export default chatModule;
