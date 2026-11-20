import { Html } from '@elysiajs/html';

interface CustomScriptType {
    src: string;
    defer: boolean;
}

export interface Scripts {
    alpine?: boolean;
    htmx?: boolean;
    htmxWebSocket?: boolean;
    customScript?: CustomScriptType[];
}

interface LayoutArgs {
    title: string;
    script?: Scripts;
    class?: string;
    children: any;
}

const themeBootstrapScript = `
(function() {
    try {
        var saved = localStorage.getItem('chatify-theme');
        var theme = (saved === 'chatify-light' || saved === 'chatify-dark') ? saved : 'chatify-dark';
        document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
    window.toggleChatifyTheme = function() {
        var current = document.documentElement.getAttribute('data-theme') || 'chatify-dark';
        var next = current === 'chatify-dark' ? 'chatify-light' : 'chatify-dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('chatify-theme', next); } catch (e) {}
        window.dispatchEvent(new CustomEvent('chatify:theme-changed', { detail: { theme: next } }));
    };
})();
`;

export const Layout = (data: LayoutArgs) => {
    return (
        <html lang="id" data-theme="chatify-dark">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{data.title} | Chatify</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
                <script>{themeBootstrapScript}</script>
                <link rel="stylesheet" href="/public/style.css" />

                {data.script?.htmx && <script src="/assets/htmx.min.js" defer></script>}
                {data.script?.htmxWebSocket && <script src="/assets/hx-ws.min.js" defer></script>}
                {data.script?.alpine && <script src="/assets/alpine.min.js" defer></script>}
                {data.script?.customScript?.map((s) => (
                    <script defer={s.defer} src={s.src}></script>
                ))}
            </head>
            <body class={data.class}>{data.children}</body>
        </html>
    );
};
