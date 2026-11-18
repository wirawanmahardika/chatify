import { Elysia } from 'elysia';
import { staticPlugin } from '@elysia/static';
import { html } from '@elysiajs/html';
import { config } from './config';
import authModule from './modules/auth';
import chatModule from './modules/chat';

export function createApp() {
    return new Elysia({
        cookie: {
            secrets: config.COOKIE_SECRET,
            sign: ['session'],
        },
    })
        .use(html())
        .use(staticPlugin())
        .get('/assets/htmx.min.js', () =>
            Bun.file('node_modules/htmx.org/dist/htmx.min.js')
        )
        .get('/assets/hx-ws.min.js', () =>
            Bun.file('node_modules/htmx.org/dist/ext/hx-ws.min.js')
        )
        .get('/assets/alpine.min.js', () =>
            Bun.file('node_modules/alpinejs/dist/cdn.min.js')
        )
        .use(authModule)
        .use(chatModule);
}
