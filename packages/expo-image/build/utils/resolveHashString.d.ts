import { ImageSource } from '../Image.types';
/**
 * Converts a blurhash string (`blurhash:/<hash>/<width>/<height>` or <hash>/<width>/<height>) into an `ImageSource`.
 *
 * @return An ImageSource representing the provided blurhash.
 * */
export declare function resolveBlurhashString(str: string): ImageSource;
/**
 * Converts a thumbhash string (`thumbhash:/<hash>` or `<hash>`) into an `ImageSource`.
 *
 * @return An ImageSource representing the provided thumbhash.
 * */
export declare function resolveThumbhashString(str: string): ImageSource;
//# sourceMappingURL=resolveHashString.d.ts.map