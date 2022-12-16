/// <reference types="node" />
import type { IncomingMessage, ServerResponse } from 'http';
export declare function suppressRemoteDebuggingErrorMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void): void;
