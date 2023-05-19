export function isRuntimeValue(value) {
    if (!value) {
        return false;
    }
    else if (Array.isArray(value)) {
        return value.some((v) => isRuntimeValue(v));
    }
    else if (typeof value === 'object') {
        if (value.type === 'runtime') {
            return true;
        }
        else {
            return Object.values(value).some((v) => isRuntimeValue(v));
        }
    }
    else {
        return false;
    }
}
//# sourceMappingURL=shared.js.map