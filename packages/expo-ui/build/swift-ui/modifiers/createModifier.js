/**
 * Factory function to create modifier configuration objects.
 * This is used internally by all modifier functions.
 */
export function createModifier(type, params = {}) {
    return { $type: type, ...params };
}
//# sourceMappingURL=createModifier.js.map