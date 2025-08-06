export function stringifyIfDate(date) {
    return date instanceof Date ? date.toISOString() : date;
}
export function stringifyDateValues(obj) {
    if (typeof obj !== 'object' || obj === null)
        return obj;
    return Object.keys(obj).reduce((acc, key) => {
        const value = obj[key];
        if (value != null && typeof value === 'object' && !(value instanceof Date)) {
            if (Array.isArray(value)) {
                return { ...acc, [key]: value.map(stringifyDateValues) };
            }
            return { ...acc, [key]: stringifyDateValues(value) };
        }
        acc[key] = stringifyIfDate(value);
        return acc;
    }, {});
}
/**
 * Extracts keys from a details object where the value is null.
 * Used for identifying which fields should be explicitly set to null in native updates.
 */
export function getNullableDetailsFields(details) {
    return Object.keys(details).filter((key) => {
        return details[key] === null;
    });
}
//# sourceMappingURL=utils.js.map