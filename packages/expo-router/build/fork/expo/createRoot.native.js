// NOTE(EvanBacon): We need this noop because Metro doesn't support optional dependencies.
// `react-dom` is not required and therefore needs to be dodged using platform extensions on native.
export function createRoot() {
    return null;
}
export function hydrateRoot() {
    return null;
}
//# sourceMappingURL=createRoot.native.js.map