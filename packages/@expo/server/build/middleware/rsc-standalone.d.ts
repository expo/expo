import { RenderRscArgs } from './rsc';
export declare function renderRscWithImportsAsync(distFolder: string, imports: {
    serverRoot: string;
    renderer: () => Promise<typeof import('expo-router/src/rsc/rsc-renderer')>;
    router: () => Promise<typeof import('expo-router/src/rsc/router/expo-definedRouter')>;
}, { body, platform, searchParams, config, method, input, contentType }: RenderRscArgs): Promise<ReadableStream<any>>;
export declare function renderRscAsync(distFolder: string, args: RenderRscArgs): Promise<ReadableStream<any>>;
