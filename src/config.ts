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
        S3_ENDPOINT: z.string().optional(),
        S3_REGION: z.string().default('us-east-1'),
        S3_BUCKET: z.string().optional(),
        S3_ACCESS_KEY_ID: z.string().optional(),
        S3_SECRET_ACCESS_KEY: z.string().optional(),
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

            const s3Fields = [
                data.S3_ENDPOINT,
                data.S3_BUCKET,
                data.S3_ACCESS_KEY_ID,
                data.S3_SECRET_ACCESS_KEY,
            ];
            const hasAnyS3 = s3Fields.some((val) => Boolean(val && val.trim().length > 0));
            if (hasAnyS3) {
                if (!data.S3_ENDPOINT?.trim()) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['S3_ENDPOINT'],
                        message: 'S3_ENDPOINT wajib diisi jika menggunakan S3 storage',
                    });
                }
                if (!data.S3_BUCKET?.trim()) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['S3_BUCKET'],
                        message: 'S3_BUCKET wajib diisi jika menggunakan S3 storage',
                    });
                }
                if (!data.S3_ACCESS_KEY_ID?.trim()) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['S3_ACCESS_KEY_ID'],
                        message: 'S3_ACCESS_KEY_ID wajib diisi jika menggunakan S3 storage',
                    });
                }
                if (!data.S3_SECRET_ACCESS_KEY?.trim()) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['S3_SECRET_ACCESS_KEY'],
                        message: 'S3_SECRET_ACCESS_KEY wajib diisi jika menggunakan S3 storage',
                    });
                }
            }
        }
    })
    .transform((data) => {
        const s3Enabled = Boolean(
            data.S3_ENDPOINT?.trim() &&
                data.S3_BUCKET?.trim() &&
                data.S3_ACCESS_KEY_ID?.trim() &&
                data.S3_SECRET_ACCESS_KEY?.trim()
        );

        return {
            NODE_ENV: data.NODE_ENV,
            PORT: data.PORT,
            DB_URL: data.DB_URL || DEV_DB_URL,
            TEST_DB_URL:
                data.TEST_DB_URL ||
                'postgres://chatify:chatify_dev_password@localhost:5433/chatify_test',
            COOKIE_SECRET: data.COOKIE_SECRET || DEV_COOKIE_SECRET,
            S3_ENDPOINT: data.S3_ENDPOINT?.trim() || undefined,
            S3_REGION: data.S3_REGION.trim() || 'us-east-1',
            S3_BUCKET: data.S3_BUCKET?.trim() || undefined,
            S3_ACCESS_KEY_ID: data.S3_ACCESS_KEY_ID?.trim() || undefined,
            S3_SECRET_ACCESS_KEY: data.S3_SECRET_ACCESS_KEY?.trim() || undefined,
            S3_ENABLED: s3Enabled,
        };
    });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('Konfigurasi environment tidak valid:', parsedEnv.error.format());
    process.exit(1);
}

export const config = parsedEnv.data;
export const env = config;
