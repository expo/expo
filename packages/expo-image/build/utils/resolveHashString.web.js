export function resolveBlurhashString(str) {
    const [blurhash, width, height] = str.replace(/^blurhash:\//, '').split('/');
    return {
        uri: blurhash,
        width: parseInt(width, 10) || 16,
        height: parseInt(height, 10) || 16,
    };
}
export function resolveThumbhashString(str) {
    const hash = str.replace(/^thumbhash:\//, '');
    return {
        uri: 'thumbhash:/' + hash,
    };
}
//# sourceMappingURL=resolveHashString.web.js.map