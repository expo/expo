import { OutputBuffer, V4Options } from './types/uuid.types';
/**
 * DO NOT USE this function in security-sensitive contexts.
 */
export declare function uuidv4(options?: V4Options): string;
export declare function uuidv4<T extends OutputBuffer>(options?: V4Options, buf?: T, offset?: number): T | string;
//# sourceMappingURL=v4.web.d.ts.map