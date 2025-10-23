import type { RenderRscArgs } from 'expo-server/private';
type ImportMap = {
    router: () => Promise<typeof import('./router/expo-definedRouter')>;
};
export declare function renderRscWithImportsAsync(distFolder: string, imports: ImportMap, { body, platform, searchParams, config, method, input, contentType, headers }: RenderRscArgs): Promise<ReadableStream<any>>;
export declare function renderRscAsync(distFolder: string, args: RenderRscArgs): Promise<ReadableStream<any>>;
export {};
//# sourceMappingURL=middleware.d.ts.map