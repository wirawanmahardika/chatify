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

export const Layout = (data: LayoutArgs) => {
    return (
        <html lang="id" data-theme="dark">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{data.title} | Chatify</title>
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
