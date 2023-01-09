import resolveAssetSource from './resolveAssetSource';
import resolveBlurhashString from './resolveBlurhashString';
export function isBlurhashString(str) {
    return /^(blurhash:\/)?[\w#$%*+,\-.:;=?@[\]^_{}|~]+(\/[\d.]+)*$/.test(str);
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