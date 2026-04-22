import OriginalColor from 'color';
export function Color(value) {
    if (typeof value === 'string' && !value.startsWith('var(')) {
        return OriginalColor(value);
    }
    return undefined;
}
//# sourceMappingURL=color.js.map