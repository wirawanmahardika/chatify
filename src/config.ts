import { z } from 'zod';

const DEV_DB_URL = 'postgres://chatify:chatify_dev_password@localhost:5433/chatify';
const DEV_COOKIE_SECRET = 'dev-only-cookie-secret-key-minimum-32-chars';

const envSchema = z
    .object({
        NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
        PORT: z.string().default('3000'),
        DB_URL: z.string().optional(),
        TEST_DB_URL: z.string().optional(),
        COOKIE_SECRET: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.NODE_ENV === 'production') {
            if (!data.DB_URL) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['DB_URL'],
                    message: 'DB_URL wajib diisi saat production',
                });
            }
            if (!data.COOKIE_SECRET || data.COOKIE_SECRET.length < 32) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['COOKIE_SECRET'],
                    message: 'COOKIE_SECRET wajib diisi minimal 32 karakter saat production',
                });
            }
        }
    })
    .transform((data) => ({
        NODE_ENV: data.NODE_ENV,
        PORT: data.PORT,
        DB_URL: data.DB_URL || DEV_DB_URL,
        TEST_DB_URL:
            data.TEST_DB_URL || 'postgres://chatify:chatify_dev_password@localhost:5433/chatify_test',
        COOKIE_SECRET: data.COOKIE_SECRET || DEV_COOKIE_SECRET,
    }));

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('Konfigurasi environment tidak valid:', parsedEnv.error.format());
    process.exit(1);
}

export const config = parsedEnv.data;
export const env = config;
