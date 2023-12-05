import Ajv, { ErrorObject, Options } from 'ajv';
import { ValidationError } from './Error';
declare type Meta = {
    asset?: boolean;
    dimensions?: {
        width: number;
        height: number;
    };
    square?: boolean;
    contentTypePattern?: string;
    contentTypeHuman?: string;
};
declare type SchemerOptions = Options & {
    rootDir?: string;
};
declare type AssetField = {
    fieldPath: string;
    data: string;
    meta: Meta;
};
export { SchemerError, ValidationError, ErrorCodes, ErrorCode } from './Error';
export default class Schemer {
    options: SchemerOptions;
    ajv: Ajv;
    schema: object;
    rootDir: string;
    manualValidationErrors: ValidationError[];
    constructor(schema: object, options?: SchemerOptions);
    _formatAjvErrorMessage({ keyword, instancePath, params, parentSchema, data, message, }: ErrorObject): ValidationError;
    getErrors(): ValidationError[];
    _throwOnErrors(): void;
    validateAll(data: any): Promise<void>;
    validateAssetsAsync(data: any): Promise<void>;
    validateSchemaAsync(data: any): Promise<void>;
    _validateSchemaAsync(data: any): void;
    _validateAssetsAsync(data: any): Promise<void>;
    _validateImageAsync({ fieldPath, data, meta }: AssetField): Promise<void>;
    _validateAssetAsync({ fieldPath, data, meta }: AssetField): Promise<void>;
    validateProperty(fieldPath: string, data: any): Promise<void>;
    validateName(name: string): Promise<void>;
    validateSlug(slug: string): Promise<void>;
    validateSdkVersion(version: string): Promise<void>;
    validateIcon(iconPath: string): Promise<void>;
}
