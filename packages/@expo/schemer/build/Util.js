"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldPathToSchema = exports.schemaPointerToFieldPath = exports.fieldPathToSchemaPath = void 0;
const get_1 = __importDefault(require("lodash/get"));
const zip_1 = __importDefault(require("lodash/zip"));
const fieldPathToSchemaPath = (fieldPath) => {
    return (0, zip_1.default)(fieldPath.split('.').fill('properties'), fieldPath.split('.')).flat().join('.');
};
exports.fieldPathToSchemaPath = fieldPathToSchemaPath;
// Assumption: used only for jsonPointer returned from traverse
const schemaPointerToFieldPath = (jsonPointer) => {
    return jsonPointer
        .split('/')
        .slice(2)
        .filter(e => e !== 'properties')
        .join('.');
};
exports.schemaPointerToFieldPath = schemaPointerToFieldPath;
const fieldPathToSchema = (schema, fieldPath) => {
    return (0, get_1.default)(schema, (0, exports.fieldPathToSchemaPath)(fieldPath));
};
exports.fieldPathToSchema = fieldPathToSchema;
//# sourceMappingURL=Util.js.map