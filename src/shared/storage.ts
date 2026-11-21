import { mkdirSync, unlinkSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { S3Client } from 'bun';
import { config } from '../config';
import { logger } from './logger';

const LOCAL_ROOT = join(process.cwd(), 'storage');

function createS3Client(): S3Client | null {
    if (config.NODE_ENV === 'test' || !config.S3_ENABLED) {
        return null;
    }

    return new S3Client({
        endpoint: config.S3_ENDPOINT,
        region: config.S3_REGION,
        bucket: config.S3_BUCKET,
        accessKeyId: config.S3_ACCESS_KEY_ID,
        secretAccessKey: config.S3_SECRET_ACCESS_KEY,
    });
}

const s3Client = createS3Client();

if (s3Client) {
    logger.info('Menggunakan S3-compatible object storage', {
        module: 'storage',
        endpoint: config.S3_ENDPOINT,
        bucket: config.S3_BUCKET,
        region: config.S3_REGION,
    });
} else {
    logger.debug('Menggunakan penyimpanan file lokal', {
        module: 'storage',
        root: LOCAL_ROOT,
    });
}

function resolveLocalPath(key: string): string {
    const cleanKey = normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    return join(LOCAL_ROOT, cleanKey);
}

export const storage = {
    isS3Active(): boolean {
        return s3Client !== null;
    },

    async upload(key: string, file: File): Promise<void> {
        if (s3Client) {
            await s3Client.write(key, file, {
                type: file.type || 'application/octet-stream',
            });
            return;
        }

        const localPath = resolveLocalPath(key);
        mkdirSync(dirname(localPath), { recursive: true });
        await Bun.write(localPath, file);
    },

    async getResponse(
        key: string,
        options?: { cacheControl?: string }
    ): Promise<Response | null> {
        if (s3Client) {
            const s3File = s3Client.file(key);
            if (!(await s3File.exists())) {
                return null;
            }
            const stat = await s3File.stat().catch(() => null);
            const headers: Record<string, string> = {
                'Content-Type': stat?.type || 'application/octet-stream',
            };
            if (options?.cacheControl) {
                headers['Cache-Control'] = options.cacheControl;
            }
            return new Response(s3File.stream(), { headers });
        }

        const localFile = Bun.file(resolveLocalPath(key));
        if (!(await localFile.exists())) {
            return null;
        }

        const headers: Record<string, string> = {};
        if (localFile.type) {
            headers['Content-Type'] = localFile.type;
        }
        if (options?.cacheControl) {
            headers['Cache-Control'] = options.cacheControl;
        }
        return new Response(localFile, { headers });
    },

    async remove(key: string): Promise<void> {
        if (s3Client) {
            await s3Client.delete(key).catch(() => {
                // Ignore if object already missing
            });
            return;
        }

        try {
            unlinkSync(resolveLocalPath(key));
        } catch {
            // Ignore if file already missing
        }
    },
};
