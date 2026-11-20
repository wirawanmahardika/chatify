import { Html } from '@elysiajs/html';

export function ModalAlert({ status, msg }: { msg: string; status: 'success' | 'error' }) {
    const styleClass =
        status === 'success'
            ? 'bg-success/15 border-success/30 text-success'
            : 'bg-error/15 border-error/30 text-error';

    return (
        <div
            class={`alert border ${styleClass} shadow-sm mb-3 flex items-center justify-between px-3.5 py-2.5 rounded-xl`}
        >
            <div class="flex items-center gap-2.5 min-w-0">
                {status === 'success' ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="stroke-current shrink-0 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="stroke-current shrink-0 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                )}
                <span class="text-xs font-semibold leading-snug">{msg}</span>
            </div>
            <button
                type="button"
                onclick="this.closest('.alert').remove()"
                class="btn btn-ghost btn-xs btn-circle shrink-0"
                title="Tutup Pesan"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>
    );
}
