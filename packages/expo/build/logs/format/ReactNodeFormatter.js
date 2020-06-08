/**
 * A pretty-format plugin for React's FiberNode objects, which are very large trees that are too
 * large and verbose to print.
 */
export default {
    test(value) {
        return (value &&
            value instanceof Object &&
            value.hasOwnProperty('tag') &&
            value.hasOwnProperty('key') &&
            value.hasOwnProperty('type'));
    },
    serialize(node, config, indentation, depth, refs, printer) {
        return `${config.min ? '' : 'FiberNode '}{${_printProperties(node, ['tag', 'key', 'type'], config, indentation, depth, refs, printer)}}`;
    },
};
function _printProperties(object, keys, config, indentation, depth, refs, printer) {
    let result = config.spacingOuter;
    const propertyIndentation = indentation + config.indent;
    for (let ii = 0; ii < keys.length; ii++) {
        const key = keys[ii];
        const name = printer(key, config, propertyIndentation, depth, refs);
        const value = printer(object[key], config, propertyIndentation, depth, refs);
        result += `${propertyIndentation}${name}: ${value}`;
        if (ii < keys.length - 1) {
            result += ',' + config.spacingInner;
        }
        else if (!config.min) {
            result += ',';
        }
    }
    result += config.spacingOuter + indentation;
    return result;
}
//# sourceMappingURL=ReactNodeFormatter.js.map