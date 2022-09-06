/// <reference types="node" />
import type { IncomingMessage, ServerResponse } from 'http';
export declare function remoteDevtoolsCorsMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void): void;
