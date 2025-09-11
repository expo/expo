import { createRequestHandler as createExpoHandler } from '../index';
export type RequestHandler = (req: Request) => Promise<Response>;
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export declare function createRequestHandler({ build }: {
    build: string;
}, setup?: Partial<Parameters<typeof createExpoHandler>[0]>): RequestHandler;
