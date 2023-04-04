function hashToUri(type, hash) {
    const encodedBlurhash = encodeURI(hash).replace(/#/g, '%23').replace(/\?/g, '%3F');
    return `${type}:/${encodedBlurhash}`;
}
/**
 * Converts a blurhash string (`blurhash:/<hash>/<width>/<height>` or <hash>/<width>/<height>) into an `ImageSource`.
 *
 * @return An ImageSource representing the provided blurhash.
 * */
export function resolveBlurhashString(str) {
    const [blurhash, width, height] = str.replace(/^blurhash:\//, '').split('/');
    return {
        uri: hashToUri('blurhash', blurhash),
        width: parseInt(width, 10) || 16,
        height: parseInt(height, 10) || 16,
    };
}
/**
 * Converts a thumbhash string (`thumbhash:/<hash>` or `<hash>`) into an `ImageSource`.
 *
 * @return An ImageSource representing the provided thumbhash.
 * */
export function resolveThumbhashString(str) {
    const thumbhash = str.replace(/^thumbhash:\//, '');
    return {
        uri: hashToUri('thumbhash', thumbhash),
    };
}
//# sourceMappingURL=resolveHashString.js.map