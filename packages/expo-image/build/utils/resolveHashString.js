function hashToUri(type, hash) {
    const encodedBlurhash = encodeURI(hash).replace(/#/g, '%23').replace(/\?/g, '%3F');
    return `${type}:/${encodedBlurhash}`;
}
export function resolveBlurhashString(str) {
    const [blurhash, width, height] = str.replace(/^blurhash:\//, '').split('/');
    return {
        uri: hashToUri('blurhash', blurhash),
        width: parseInt(width, 10) || 16,
        height: parseInt(height, 10) || 16,
    };
}
export function resolveThumbhashString(str) {
    const thumbhash = str.replace(/^thumbhash:\//, '');
    return {
        uri: hashToUri('thumbhash', thumbhash),
    };
}
//# sourceMappingURL=resolveHashString.js.map