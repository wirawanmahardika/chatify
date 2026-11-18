import { config } from './config';
import { logger } from './shared/logger';
import { createApp } from './app';

const app = createApp().listen(config.PORT);

logger.info('Server Chatify berjalan', {
    module: 'app',
    hostname: app.server?.hostname,
    port: app.server?.port,
    env: config.NODE_ENV,
});
