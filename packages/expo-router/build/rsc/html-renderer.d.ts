import '@expo/metro-runtime/rsc/runtime';
type ResolveClientEntry = (id: string, env: 'client' | 'react-server' | 'node') => {
    id: string;
    chunks: string[];
};
export declare function renderHtml({ pathname, isExporting, htmlHead, searchParams, serverRoot, loadModule, getSsrConfigForHtml, resolveClientEntry, renderRscForHtml, scriptUrl, }: {
    scriptUrl?: string;
    pathname: string;
    isExporting: boolean;
    searchParams: URLSearchParams;
    htmlHead: string;
    serverRoot: string;
    renderRscForHtml: (input: string, searchParams: URLSearchParams) => Promise<ReadableStream>;
    getSsrConfigForHtml: (pathname: string, searchParams: URLSearchParams) => Promise<{
        input: string;
        searchParams?: URLSearchParams;
        body: ReadableStream;
    } | null>;
    resolveClientEntry: ResolveClientEntry;
    loadModule: (id: string) => Promise<any>;
}): Promise<ReadableStream<Uint8Array> | null>;
export {};
//# sourceMappingURL=html-renderer.d.ts.map