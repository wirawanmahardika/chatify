import { Html } from '@elysiajs/html';

export function ModalAlert({ status, msg }: { msg: string; status: 'success' | 'error' }) {
    const alertClass = status === 'success' ? 'alert-success' : 'alert-error';

    return (
        <div
            class={`alert ${alertClass} shadow-sm mb-4 flex items-center justify-between p-3 rounded-lg`}
        >
            <div class="flex items-center gap-2">
                {status === 'success' ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="stroke-current shrink-0 h-5 w-5"
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
                        class="stroke-current shrink-0 h-5 w-5"
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
                <span class="text-xs font-semibold">{msg}</span>
            </div>
            <button
                type="button"
                onclick="this.closest('.alert').remove()"
                class="btn btn-ghost btn-xs btn-circle"
                title="Tutup Pesan"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
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
