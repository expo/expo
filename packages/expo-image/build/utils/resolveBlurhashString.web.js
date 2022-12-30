export default function resolveBlurhashString(str) {
    const [blurhash, width, height] = str.replace(/^blurhash:\//, '').split('/');
    return {
        uri: blurhash,
        width: parseInt(width, 10) || 16,
        height: parseInt(height, 10) || 16,
    };
}
//# sourceMappingURL=resolveBlurhashString.web.js.map