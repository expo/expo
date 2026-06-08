import * as fs from 'node:fs';
export interface WriteFileAtomicOptions {
    mode?: fs.Mode;
}
export declare function writeFileAtomicSync(filename: string, data: string | Buffer, options?: WriteFileAtomicOptions): void;
export declare function writeFileAtomic(filename: string, data: string | Buffer, options?: WriteFileAtomicOptions): Promise<void>;
