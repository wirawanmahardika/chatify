import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { config } from '../config';

export const usersTable = sqliteTable('users', {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(strftime('%s', 'now'))`),
});

export const sessionsTable = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const roomsTable = sqliteTable('rooms', {
    id: text('id').primaryKey(),
    name: text('name'),
    type: text('type').$type<'direct' | 'group'>().notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(strftime('%s', 'now'))`),
});

export const roomMembersTable = sqliteTable(
    'room_members',
    {
        roomId: text('room_id')
            .notNull()
            .references(() => roomsTable.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    },
    (table) => [primaryKey({ columns: [table.roomId, table.userId] })]
);

export const messagesTable = sqliteTable('messages', {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    roomId: text('room_id')
        .notNull()
        .references(() => roomsTable.id, { onDelete: 'cascade' }),
    userId: text('user_id')
        .notNull()
        .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(strftime('%s', 'now'))`),
});

export const friendshipsTable = sqliteTable(
    'friendships',
    {
        senderId: text('sender_id')
            .notNull()
            .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
        receiverId: text('receiver_id')
            .notNull()
            .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
        status: text('status')
            .$type<'pending' | 'accepted' | 'rejected'>()
            .notNull()
            .default('pending'),
        createdAt: integer('created_at', { mode: 'timestamp' })
            .notNull()
            .default(sql`(strftime('%s', 'now'))`),
        updatedAt: integer('updated_at', { mode: 'timestamp' })
            .notNull()
            .default(sql`(strftime('%s', 'now'))`),
    },
    (table) => [primaryKey({ columns: [table.senderId, table.receiverId] })]
);

export const schema = {
    usersTable,
    sessionsTable,
    roomsTable,
    roomMembersTable,
    messagesTable,
    friendshipsTable,
};

export const sqlite = createClient({ url: config.DB_URL });
export const db = drizzle(sqlite, { schema });
