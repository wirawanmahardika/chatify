import { z } from 'zod';

export const userSchema = z.object({
    id: z.string(),
    username: z.string(),
    passwordHash: z.string(),
    createdAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

export const publicUserSchema = userSchema.omit({ passwordHash: true });
export type PublicUser = z.infer<typeof publicUserSchema>;

export const sessionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    expiresAt: z.date(),
});

export type Session = z.infer<typeof sessionSchema>;

export const registerBodySchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, 'Username minimal 3 karakter')
        .max(30, 'Username maksimal 30 karakter')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh berisi huruf, angka, dan garis bawah'),
    password: z.string().min(6, 'Kata sandi minimal 6 karakter').max(128, 'Kata sandi terlalu panjang'),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
    username: z.string().trim().min(1, 'Username wajib diisi'),
    password: z.string().min(1, 'Kata sandi wajib diisi'),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
