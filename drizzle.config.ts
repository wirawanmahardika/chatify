import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/shared/db.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DB_URL || 'postgres://chatify:chatify_dev_password@localhost:5433/chatify',
    },
});
