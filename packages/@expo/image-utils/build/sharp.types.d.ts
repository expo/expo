import { ImageFormat, ResizeMode } from './Image.types';
export declare type SharpGlobalOptions = {
    compressionLevel?: '';
    format?: ImageFormat;
    input: string;
    limitInputPixels?: number;
    output: string;
    progressive?: boolean;
    quality?: number;
    withMetadata?: boolean;
    [key: string]: string | number | boolean | undefined | null;
};
export declare type SharpCommandOptions = RemoveAlphaOptions | ResizeOptions | FlattenOptions;
export declare type FlattenOptions = {
    operation: 'flatten';
    background: string;
};
export declare type RemoveAlphaOptions = {
    operation: 'removeAlpha';
};
export declare type Position = 'center' | 'centre' | 'north' | 'east' | 'south' | 'west' | 'northeast' | 'southeast' | 'southwest' | 'northwest' | 'top' | 'right' | 'bottom' | 'left' | 'right top' | 'right bottom' | 'left bottom' | 'left top' | 'entropy' | 'attention';
export declare type ResizeOptions = {
    operation: 'resize';
    background?: string;
    fastShrinkOnLoad?: boolean;
    fit?: ResizeMode;
    height?: number;
    kernel?: 'nearest' | 'cubic' | 'mitchell' | 'lanczos2' | 'lanczos3';
    position?: Position;
    width: number;
    withoutEnlargement?: boolean;
};
export declare type Options = object | {
    [key: string]: boolean | number | string | undefined;
};
