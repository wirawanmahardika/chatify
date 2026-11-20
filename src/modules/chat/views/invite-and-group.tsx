import { Html } from '@elysiajs/html';
import type { UserSearchResult } from '../model';
import { Layout } from '../../../shared/views/layout';
import type { User } from '../../auth/model';
import { UserAvatar } from '../../../shared/components/avatar';

export function InvitePage({
    user,
    target,
    isSelf,
}: {
    user: User;
    target: UserSearchResult | null;
    isSelf: boolean;
}) {
    return (
        <Layout
            title="Undangan Pertemanan"
            script={{ htmx: true, alpine: true }}
            class="bg-base-100 text-base-content min-h-screen antialiased relative overflow-x-hidden"
        >
            <div class="pointer-events-none fixed inset-0 bg-ambient-grid opacity-40"></div>
            <div class="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-140 h-95 rounded-full bg-primary/15 blur-[120px]"></div>

            <div class="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div class="w-full max-w-md rounded-2xl bg-base-200/85 backdrop-blur-xl border border-base-300/90 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-4">
                    {isSelf ? (
                        <>
                            <div class="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xl">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <h2 class="text-xl font-bold">Link Undangan Anda</h2>
                            <p class="text-xs text-base-content/70 leading-relaxed">
                                Bagikan link ini kepada teman agar mereka dapat menambahkan{' '}
                                <strong>{user.username}</strong> (ID: {user.id}).
                            </p>
                            <a href="/contact" class="btn btn-primary btn-sm rounded-xl mt-2">
                                Kembali ke Kontak
                            </a>
                        </>
                    ) : !target ? (
                        <>
                            <h2 class="text-xl font-bold text-error">Undangan Tidak Ditemukan</h2>
                            <p class="text-xs text-base-content/70">
                                Pengguna tidak ditemukan atau undangan tidak tersedia.
                            </p>
                            <a href="/contact" class="btn btn-ghost btn-sm rounded-xl mt-2">
                                Kembali ke Kontak
                            </a>
                        </>
                    ) : (
                        <>
                            <UserAvatar
                                username={target.username}
                                avatarUrl={target.avatarUrl}
                                size="lg"
                                variant="gradient"
                            />
                            <div>
                                <h2 class="text-xl font-bold">{target.username}</h2>
                                <p class="text-xs font-mono text-base-content/60 mt-0.5">
                                    ID: {target.id}
                                </p>
                            </div>

                            <div id="invite-alert" class="w-full"></div>

                            {target.relationStatus === 'none' && (
                                <button
                                    type="button"
                                    class="btn btn-primary w-full rounded-xl shadow-md shadow-primary/20"
                                    hx-post="/contact"
                                    hx-target="#invite-alert"
                                    hx-vals={`{"id": "${target.id}"}`}
                                >
                                    Kirim Permintaan Pertemanan
                                </button>
                            )}
                            {target.relationStatus === 'pending_outgoing' && (
                                <span class="badge badge-ghost rounded-lg py-3 px-4">
                                    Permintaan pertemanan sudah dikirim
                                </span>
                            )}
                            {target.relationStatus === 'pending_incoming' && (
                                <button
                                    type="button"
                                    class="btn btn-success text-white w-full rounded-xl"
                                    hx-patch="/contact"
                                    hx-vals={`{"id": "${target.id}", "status": "accepted"}`}
                                >
                                    Terima Permintaan Pertemanan
                                </button>
                            )}
                            {target.relationStatus === 'accepted' && (
                                <form method="POST" action="/direct" class="w-full">
                                    <input type="hidden" name="targetUserId" value={target.id} />
                                    <button type="submit" class="btn btn-primary w-full rounded-xl">
                                        Mulai Obrolan
                                    </button>
                                </form>
                            )}

                            <a href="/contact" class="btn btn-ghost btn-sm rounded-xl">
                                Kembali ke Kontak
                            </a>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export function GroupMembersModalContent({
    roomId,
    roomName,
    members,
    currentUserId,
    currentUserRole,
    addableContacts,
}: {
    roomId: string;
    roomName: string;
    members: { userId: string; username: string; avatarUrl?: string | null; role: string }[];
    currentUserId: string;
    currentUserRole: string;
    addableContacts: { id: string; username: string }[];
}) {
    const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

    return (
        <div class="space-y-4">
            <div>
                <h3 class="font-bold text-base truncate">{roomName}</h3>
                <p class="text-[11px] text-base-content/60">{members.length} anggota terdaftar</p>
            </div>

            <div id="group-member-alert"></div>

            {canManage && addableContacts.length > 0 && (
                <form
                    hx-post={`/group/${roomId}/members`}
                    hx-target="#group-member-alert"
                    class="flex gap-2"
                >
                    <select
                        name="userId"
                        class="select select-bordered bg-base-100 select-sm flex-1 rounded-xl text-xs"
                        required
                    >
                        <option value="" disabled selected>
                            Tambah anggota...
                        </option>
                        {addableContacts.map((c) => (
                            <option value={c.id}>{c.username}</option>
                        ))}
                    </select>
                    <button type="submit" class="btn btn-primary btn-sm rounded-xl">
                        Tambah
                    </button>
                </form>
            )}

            <div class="space-y-1.5">
                {members.map((m) => (
                    <div class="flex items-center justify-between p-2.5 rounded-xl bg-base-100/70 border border-base-300/70">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <UserAvatar
                                username={m.username}
                                avatarUrl={m.avatarUrl}
                                size="xs"
                                variant="primary"
                            />
                            <div class="min-w-0">
                                <p class="text-sm font-semibold truncate">{m.username}</p>
                                <span class="text-[11px] text-base-content/60 capitalize">
                                    {m.role === 'owner'
                                        ? 'Pemilik'
                                        : m.role === 'admin'
                                          ? 'Admin'
                                          : 'Anggota'}
                                </span>
                            </div>
                        </div>

                        {m.userId === currentUserId ? (
                            <button
                                type="button"
                                class="btn btn-ghost btn-xs rounded-lg text-error hover:bg-error/10 shrink-0"
                                hx-confirm="Keluar dari grup ini?"
                                hx-delete={`/group/${roomId}/members/${m.userId}`}
                            >
                                Keluar
                            </button>
                        ) : (
                            canManage &&
                            m.role !== 'owner' && (
                                <button
                                    type="button"
                                    class="btn btn-ghost btn-xs rounded-lg text-error hover:bg-error/10 shrink-0"
                                    hx-confirm={`Keluarkan ${m.username} dari grup?`}
                                    hx-delete={`/group/${roomId}/members/${m.userId}`}
                                >
                                    Keluarkan
                                </button>
                            )
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
