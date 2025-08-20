/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 dai-shi.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/f9111ed7d96c95d7e128b37e8f7ae2d80122218e/packages/waku/src/lib/middleware/rsc.ts#L1
 */
type ResolvedConfig = any;
export type RenderRscArgs = {
    config: ResolvedConfig;
    input: string;
    searchParams: URLSearchParams;
    platform: string;
    engine?: 'hermes' | null;
    method: 'GET' | 'POST';
    body?: ReadableStream | null;
    contentType?: string | undefined;
    decodedBody?: unknown;
    moduleIdCallback?: ((id: string) => void) | undefined;
    onError?: (err: unknown) => void;
    headers: Record<string, string>;
};
export declare const decodeInput: (encodedInput: string) => string;
export declare function getRscMiddleware(options: {
    config: ResolvedConfig;
    baseUrl: string;
    rscPath: string;
    renderRsc: (args: RenderRscArgs) => Promise<ReadableStream<any>>;
    onError?: (err: unknown) => void;
}): {
    GET: (req: Request) => Promise<Response>;
    POST: (req: Request) => Promise<Response>;
};
export {};
