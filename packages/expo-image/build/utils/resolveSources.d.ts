import { ImageNativeProps, ImageProps, ImageSource } from '../Image.types';
export declare function isBlurhashString(str: string): boolean;
export declare function isThumbhashString(str: string): boolean;
export declare function resolveSource(source?: ImageSource | string | number | null): ImageSource | null;
/**
 * Resolves provided `source` prop to an array of objects expected by the native implementation.
 */
export declare function resolveSources(sources?: ImageProps['source']): ImageNativeProps['source'];
//# sourceMappingURL=resolveSources.d.ts.map