"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.ValidationError = exports.SchemerError = void 0;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const fs_1 = __importDefault(require("fs"));
const json_schema_traverse_1 = __importDefault(require("json-schema-traverse"));
const get_1 = __importDefault(require("lodash/get"));
const path_1 = __importDefault(require("path"));
const probe_image_size_1 = __importDefault(require("probe-image-size"));
const read_chunk_1 = __importDefault(require("read-chunk"));
const Error_1 = require("./Error");
const Util_1 = require("./Util");
function lowerFirst(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}
var Error_2 = require("./Error");
Object.defineProperty(exports, "SchemerError", { enumerable: true, get: function () { return Error_2.SchemerError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return Error_2.ValidationError; } });
Object.defineProperty(exports, "ErrorCodes", { enumerable: true, get: function () { return Error_2.ErrorCodes; } });
class Schemer {
    // Schema is a JSON Schema object
    constructor(schema, options = {}) {
        this.options = {
            allErrors: true,
            verbose: true,
            meta: true,
            strict: false,
            unicodeRegExp: false,
            ...options,
        };
        this.ajv = new ajv_1.default(this.options);
        (0, ajv_formats_1.default)(this.ajv, { mode: 'full' });
        this.schema = schema;
        this.rootDir = this.options.rootDir || __dirname;
        this.manualValidationErrors = [];
    }
    _formatAjvErrorMessage({ keyword, instancePath, params, parentSchema, data, message, }) {
        const meta = parentSchema && parentSchema.meta;
        // This removes the "." in front of a fieldPath
        instancePath = instancePath.slice(1);
        switch (keyword) {
            case 'additionalProperties': {
                return new Error_1.ValidationError({
                    errorCode: 'SCHEMA_ADDITIONAL_PROPERTY',
                    fieldPath: instancePath,
                    message: `should NOT have additional property '${params.additionalProperty}'`,
                    data,
                    meta,
                });
            }
            case 'required':
                return new Error_1.ValidationError({
                    errorCode: 'SCHEMA_MISSING_REQUIRED_PROPERTY',
                    fieldPath: instancePath,
                    message: `is missing required property '${params.missingProperty}'`,
                    data,
                    meta,
                });
            case 'pattern': {
                //@TODO Parse the message in a less hacky way. Perhaps for regex validation errors, embed the error message under the meta tag?
                const regexHuman = meta === null || meta === void 0 ? void 0 : meta.regexHuman;
                const regexErrorMessage = regexHuman
                    ? `'${instancePath}' should be a ${regexHuman[0].toLowerCase() + regexHuman.slice(1)}`
                    : `'${instancePath}' ${message}`;
                return new Error_1.ValidationError({
                    errorCode: 'SCHEMA_INVALID_PATTERN',
                    fieldPath: instancePath,
                    message: regexErrorMessage,
                    data,
                    meta,
                });
            }
            case 'not': {
                const notHuman = meta === null || meta === void 0 ? void 0 : meta.notHuman;
                const notHumanErrorMessage = notHuman
                    ? `'${instancePath}' should be ${notHuman[0].toLowerCase() + notHuman.slice(1)}`
                    : `'${instancePath}' ${message}`;
                return new Error_1.ValidationError({
                    errorCode: 'SCHEMA_INVALID_NOT',
                    fieldPath: instancePath,
                    message: notHumanErrorMessage,
                    data,
                    meta,
                });
            }
            default:
                return new Error_1.ValidationError({
                    errorCode: 'SCHEMA_VALIDATION_ERROR',
                    fieldPath: instancePath,
                    message: message || 'Validation error',
                    data,
                    meta,
                });
        }
    }
    getErrors() {
        // Convert AJV JSONSchema errors to our ValidationErrors
        let valErrors = [];
        if (this.ajv.errors) {
            valErrors = this.ajv.errors.map(e => this._formatAjvErrorMessage(e));
        }
        return [...valErrors, ...this.manualValidationErrors];
    }
    _throwOnErrors() {
        // Clean error state after each validation
        const errors = this.getErrors();
        if (errors.length > 0) {
            this.manualValidationErrors = [];
            this.ajv.errors = [];
            throw new Error_1.SchemerError(errors);
        }
    }
    async validateAll(data) {
        await this._validateSchemaAsync(data);
        await this._validateAssetsAsync(data);
        this._throwOnErrors();
    }
    async validateAssetsAsync(data) {
        await this._validateAssetsAsync(data);
        this._throwOnErrors();
    }
    async validateSchemaAsync(data) {
        await this._validateSchemaAsync(data);
        this._throwOnErrors();
    }
    _validateSchemaAsync(data) {
        this.ajv.validate(this.schema, data);
    }
    async _validateAssetsAsync(data) {
        const assets = [];
        (0, json_schema_traverse_1.default)(this.schema, { allKeys: true }, (subSchema, jsonPointer, a, b, c, d, property) => {
            if (property && subSchema.meta && subSchema.meta.asset) {
                const fieldPath = (0, Util_1.schemaPointerToFieldPath)(jsonPointer);
                assets.push({
                    fieldPath,
                    data: (0, get_1.default)(data, lowerFirst(fieldPath)) || (0, get_1.default)(data, fieldPath),
                    meta: subSchema.meta,
                });
            }
        });
        await Promise.all(assets.map(this._validateAssetAsync.bind(this)));
    }
    async _validateImageAsync({ fieldPath, data, meta }) {
        if (meta && meta.asset && data) {
            const { dimensions, square, contentTypePattern } = meta;
            // filePath could be an URL
            const filePath = path_1.default.resolve(this.rootDir, data);
            try {
                // NOTE(nikki): The '4100' below should be enough for most file types, though we
                //              could probably go shorter....
                //              http://www.garykessler.net/library/file_sigs.html
                //  The metadata content for .jpgs might be located a lot farther down the file, so this
                //  may pose problems in the future.
                //  This cases on whether filePath is a remote URL or located on the machine
                const probeResult = fs_1.default.existsSync(filePath)
                    ? probe_image_size_1.default.sync(await (0, read_chunk_1.default)(filePath, 0, 4100))
                    : await (0, probe_image_size_1.default)(data, { useElectronNet: false });
                if (!probeResult) {
                    return;
                }
                const { width, height, type, mime } = probeResult;
                if (contentTypePattern && !mime.match(new RegExp(contentTypePattern))) {
                    this.manualValidationErrors.push(new Error_1.ValidationError({
                        errorCode: 'INVALID_CONTENT_TYPE',
                        fieldPath,
                        message: `field '${fieldPath}' should point to ${meta.contentTypeHuman} but the file at '${data}' has type ${type}`,
                        data,
                        meta,
                    }));
                }
                if (dimensions && (dimensions.height !== height || dimensions.width !== width)) {
                    this.manualValidationErrors.push(new Error_1.ValidationError({
                        errorCode: 'INVALID_DIMENSIONS',
                        fieldPath,
                        message: `'${fieldPath}' should have dimensions ${dimensions.width}x${dimensions.height}, but the file at '${data}' has dimensions ${width}x${height}`,
                        data,
                        meta,
                    }));
                }
                if (square && width !== height) {
                    this.manualValidationErrors.push(new Error_1.ValidationError({
                        errorCode: 'NOT_SQUARE',
                        fieldPath,
                        message: `image should be square, but the file at '${data}' has dimensions ${width}x${height}`,
                        data,
                        meta,
                    }));
                }
            }
            catch {
                this.manualValidationErrors.push(new Error_1.ValidationError({
                    errorCode: 'INVALID_ASSET_URI',
                    fieldPath,
                    message: `cannot access file at '${data}'`,
                    data,
                    meta,
                }));
            }
        }
    }
    async _validateAssetAsync({ fieldPath, data, meta }) {
        if (meta && meta.asset && data) {
            if (meta.contentTypePattern && meta.contentTypePattern.startsWith('^image')) {
                await this._validateImageAsync({ fieldPath, data, meta });
            }
        }
    }
    async validateProperty(fieldPath, data) {
        const subSchema = (0, Util_1.fieldPathToSchema)(this.schema, fieldPath);
        this.ajv.validate(subSchema, data);
        if (subSchema.meta && subSchema.meta.asset) {
            await this._validateAssetAsync({ fieldPath, data, meta: subSchema.meta });
        }
        this._throwOnErrors();
    }
    validateName(name) {
        return this.validateProperty('name', name);
    }
    validateSlug(slug) {
        return this.validateProperty('slug', slug);
    }
    validateSdkVersion(version) {
        return this.validateProperty('sdkVersion', version);
    }
    validateIcon(iconPath) {
        return this.validateProperty('icon', iconPath);
    }
}
exports.default = Schemer;
//# sourceMappingURL=index.js.map