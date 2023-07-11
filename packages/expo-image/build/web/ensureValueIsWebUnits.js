export function ensureValueIsWebUnits(value) {
    const trimmedValue = String(value).trim();
    if (trimmedValue.endsWith('%')) {
        return trimmedValue;
    }
    return `${trimmedValue}px`;
}
//# sourceMappingURL=ensureValueIsWebUnits.js.map