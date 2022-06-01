/**
 * Get the best estimate safe area before native modules have fully loaded,
 * this is the fallback file which assumes guessing cannot be done.
 */
export function getStaticSafeArea() {
    return {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    };
}
//# sourceMappingURL=getStaticSafeArea.js.map