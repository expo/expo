/// <reference types="node" />
import Jimp from 'jimp-compact';
import { ResizeOptions, SharpCommandOptions, SharpGlobalOptions } from './sharp.types';
type JimpGlobalOptions = Omit<SharpGlobalOptions, 'input'> & {
    input: string | Buffer | Jimp;
    originalInput: string;
};
export declare function resizeBufferAsync(buffer: Buffer, sizes: number[]): Promise<Buffer[]>;
export declare function convertFormat(format?: string): string | undefined;
export declare function jimpAsync(options: JimpGlobalOptions, commands?: SharpCommandOptions[]): Promise<Buffer>;
export declare function isFolderAsync(path: string): Promise<boolean>;
export declare function circleAsync(jimp: Jimp): Promise<Jimp>;
/**
 * Create a square image of a given size and color. Defaults to a white PNG.
 */
export declare function createSquareAsync({ size, color, mime, }: {
    size: number;
    color?: string;
    mime?: any;
}): Promise<Buffer>;
export declare function getJimpImageAsync(input: string | Buffer | Jimp): Promise<Jimp>;
export declare function resize({ input, quality }: JimpGlobalOptions, { background, position, fit, width, height }: Omit<ResizeOptions, 'operation'>): Promise<Jimp>;
export {};
