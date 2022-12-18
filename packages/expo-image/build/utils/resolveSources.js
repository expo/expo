import resolveAssetSource from './resolveAssetSource';
function isBlurhashString(str) {
    return /^(blurhash:\/)?[\w#$%*+,\-.:;=?@[\]^_{}|~]+(\/[\d.]+)*$/.test(str);
}
function blurhashToURI(blurhash) {
    const encodedBlurhash = encodeURI(blurhash).replace(/#/g, '%23').replace(/\?/g, '%3F');
    return `blurhash:/${encodedBlurhash}`;
}
function resolveBlurhashString(str) {
    const [blurhash, width, height] = str.replace(/^blurhash:\//, '').split('/');
    return {
        uri: blurhashToURI(blurhash),
        width: parseInt(width, 10) || 16,
        height: parseInt(height, 10) || 16,
    };
}
function resolveSource(source) {
    if (typeof source === 'string') {
        if (isBlurhashString(source)) {
            return resolveBlurhashString(source);
        }
        return { uri: source };
    }
    if (typeof source === 'number') {
        return resolveAssetSource(source);
    }
    if (typeof source === 'object' && source?.blurhash) {
        const { blurhash, ...restSource } = source;
        return {
            ...resolveBlurhashString(blurhash),
            ...restSource,
        };
    }
    return source ?? null;
}
/**
 * Resolves provided `source` prop to an array of objects expected by the native implementation.
 */
export function resolveSources(sources) {
    if (Array.isArray(sources)) {
        return sources.map(resolveSource).filter(Boolean);
    }
    return [resolveSource(sources)].filter(Boolean);
}
//# sourceMappingURL=resolveSources.js.map