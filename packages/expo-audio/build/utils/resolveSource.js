import resolveAssetSource from './resolveAssetSource';
export function resolveSource(source) {
    if (typeof source === 'string') {
        return { uri: source };
    }
    if (typeof source === 'number') {
        return resolveAssetSource(source);
    }
    return source ?? null;
}
//# sourceMappingURL=resolveSource.js.map