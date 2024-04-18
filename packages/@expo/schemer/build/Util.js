"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldPathToSchema = exports.schemaPointerToFieldPath = exports.fieldPathToSchemaPath = void 0;
exports.pathToSegments = pathToSegments;
exports.get = get;
const fieldPathToSchemaPath = (fieldPath) => {
    return pathToSegments(fieldPath)
        .map((segment) => `properties.${segment}`)
        .join('.');
};
exports.fieldPathToSchemaPath = fieldPathToSchemaPath;
// Assumption: used only for jsonPointer returned from traverse
const schemaPointerToFieldPath = (jsonPointer) => {
    return jsonPointer
        .split('/')
        .slice(2)
        .filter((error) => error !== 'properties')
        .join('.');
};
exports.schemaPointerToFieldPath = schemaPointerToFieldPath;
const fieldPathToSchema = (schema, fieldPath) => {
    return get(schema, (0, exports.fieldPathToSchemaPath)(fieldPath));
};
exports.fieldPathToSchema = fieldPathToSchema;
function pathToSegments(path) {
    return Array.isArray(path) ? path : path.split('.');
}
function get(object, path) {
    const segments = pathToSegments(path);
    const length = segments.length;
    let index = 0;
    while (object != null && index < length) {
        object = object[segments[index++]];
    }
    return index && index === length ? object : undefined;
}
//# sourceMappingURL=Util.js.map