const getName = (value) => {
    if (typeof value === 'string') {
        return value;
    }
    else if (typeof value === 'function') {
        return value.name;
    }
    return value;
};
const replacer = (key, value) => {
    switch (key) {
        case 'type':
            return getName(value);
        case '_owner':
        case '_store':
        case 'ref':
        case 'key':
            return;
        default:
            return value;
    }
};
export const serialize = (entry) => {
    return JSON.stringify(entry, replacer);
};
//# sourceMappingURL=serializer.js.map