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
//# sourceMappingURL=utils.js.map