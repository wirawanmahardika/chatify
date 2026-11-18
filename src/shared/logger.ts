import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '../config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

const SENSITIVE_KEYS = new Set([
    'password',
    'passwordhash',
    'sessionid',
    'cookie',
    'cookies',
    'token',
    'secret',
    'cookiesecret',
    'authorization',
]);

function sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized: LogContext = {};
    for (const [key, value] of Object.entries(context)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) {
            sanitized[key] = '[REDACTED]';
            continue;
        }
        if (value instanceof Error) {
            sanitized[key] = {
                name: value.name,
                message: value.message,
            };
            continue;
        }
        sanitized[key] = value;
    }
    return sanitized;
}

class Logger {
    private readonly logDir = join(process.cwd(), 'logs');
    private logDirReady = false;

    private writeToFile(level: LogLevel, line: string): void {
        if (config.NODE_ENV !== 'production') return;

        try {
            if (!this.logDirReady) {
                mkdirSync(this.logDir, { recursive: true });
                this.logDirReady = true;
            }
            const dateStr = new Date().toISOString().slice(0, 10);
            const fileName = level === 'error' ? `error-${dateStr}.log` : `app-${dateStr}.log`;
            appendFileSync(join(this.logDir, fileName), `${line}\n`, 'utf8');
        } catch {
            // Avoid throwing inside logger
        }
    }

    private log(level: LogLevel, message: string, context?: LogContext): void {
        if (level === 'debug' && config.NODE_ENV === 'production') {
            return;
        }
        if (config.NODE_ENV === 'test' && (level === 'debug' || level === 'info')) {
            return;
        }

        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(sanitizeContext(context) ?? {}),
        };

        const serialized = JSON.stringify(entry);

        if (level === 'error') {
            console.error(serialized);
        } else if (level === 'warn') {
            console.warn(serialized);
        } else {
            console.log(serialized);
        }

        this.writeToFile(level, serialized);
    }

    debug(message: string, context?: LogContext): void {
        this.log('debug', message, context);
    }

    info(message: string, context?: LogContext): void {
        this.log('info', message, context);
    }

    warn(message: string, context?: LogContext): void {
        this.log('warn', message, context);
    }

    error(message: string, context?: LogContext): void {
        this.log('error', message, context);
    }
}

export const logger = new Logger();
