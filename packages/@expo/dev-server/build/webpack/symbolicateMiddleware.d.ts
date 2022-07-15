/// <reference types="expo__bunyan" />
/// <reference types="node" />
import Log from '@expo/bunyan';
import type { IncomingMessage, ServerResponse } from 'http';
import { AnyCompiler } from './getFileAsync';
export declare function createSymbolicateMiddleware({ projectRoot, logger, compiler, }: {
    projectRoot: string;
    logger: Log;
    compiler: AnyCompiler;
}): (req: IncomingMessage & {
    body?: any;
    rawBody?: any;
}, res: ServerResponse) => Promise<ServerResponse>;
