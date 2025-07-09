import { ImageSource } from '../Image.types';
/**
 * Converts a string in blurhash format (`blurhash:/<hash>/<width>/<height>`
 * or <hash>/<width>/<height>) into an `ImageSource`.
 *
 * @return An ImageSource representing the provided blurhash.
 * */
export declare function resolveBlurhashString(str: string): ImageSource;
/**
 * Converts a string in thumbhash format (`thumbhash:/<hash>` or `<hash>`)
 * into an `ImageSource`.
 * Note: Unlike the `resolveBlurhashString` the `thumbhash:/` scheme has to be present,
 * as the scheme has to be explicitly stated to be interpreted a `thumbhash` source.
 *
 * @return An ImageSource representing the provided thumbhash.
 * */
export declare function resolveThumbhashString(str: string): ImageSource;
//# sourceMappingURL=resolveHashString.web.d.ts.map