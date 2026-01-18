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
    const json = JSON.stringify(entry, replacer);
    return json;
};
//# sourceMappingURL=serializer.js.map