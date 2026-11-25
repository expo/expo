import {
  validate,
  visit,
  ValidationError as SchemaValidationError,
  JSONSchema,
} from '@expo/schema-utils';
import fs from 'fs';
import path from 'path';
import imageProbe from 'probe-image-size';

import { SchemerError, ValidationError, type ErrorCode } from './Error';

interface Meta {
  asset?: boolean;
  dimensions?: {
    width: number;
    height: number;
  };
  square?: boolean;
  contentTypePattern?: string;
  contentTypeHuman?: string;
}

interface SchemerOptions {
  rootDir?: string;
}

interface AssetField {
  fieldPath: string;
  data: string;
  meta: Meta;
}

interface SchemaUtilsError {
  message: string;
  path: string;
  keyword: string;
  value: unknown;
}

export { SchemerError, ValidationError, ErrorCodes, type ErrorCode } from './Error';

const ERROR_CODES: Record<string, ErrorCode> = {
  additionalProperties: 'SCHEMA_ADDITIONAL_PROPERTY',
  required: 'SCHEMA_MISSING_REQUIRED_PROPERTY',
  pattern: 'SCHEMA_INVALID_PATTERN',
  not: 'SCHEMA_INVALID_NOT',
};

const toFieldPath = (path: string): string => (path[0] === '.' ? path.slice(1) : path);

export default class Schemer {
  options: SchemerOptions;
  schema: JSONSchema;
  rootDir: string;
  manualValidationErrors: ValidationError[];
  schemaValidationErrors: ValidationError[];

  constructor(schema: JSONSchema, options: SchemerOptions = {}) {
    this.options = { ...options };
    this.schema = schema;
    this.rootDir = (this.options.rootDir as string) || __dirname;
    this.manualValidationErrors = [];
    this.schemaValidationErrors = [];
  }

  _formatValidationError({ keyword, path, value, message }: SchemaUtilsError): ValidationError {
    return new ValidationError({
      errorCode: ERROR_CODES[keyword] ?? 'SCHEMA_VALIDATION_ERROR',
      fieldPath: toFieldPath(path),
      message,
      data: value,
      meta: undefined,
    });
  }

  getErrors(): ValidationError[] {
    return [...this.schemaValidationErrors, ...this.manualValidationErrors];
  }

  _throwOnErrors() {
    // Clean error state after each validation
    const errors = this.getErrors();
    if (errors.length > 0) {
      this.manualValidationErrors = [];
      this.schemaValidationErrors = [];
      throw new SchemerError(errors);
    }
  }

  async validateAll(data: any) {
    this._validateSchema(data);
    await this._validateAssetsAsync(data);
    this._throwOnErrors();
  }

  async validateAssetsAsync(data: any) {
    await this._validateAssetsAsync(data);
    this._throwOnErrors();
  }

  async validateSchemaAsync(data: any) {
    this._validateSchema(data);
    this._throwOnErrors();
  }

  _validateSchema(data: any) {
    try {
      validate(this.schema, data);
    } catch (error: any) {
      if (error instanceof SchemaValidationError) {
        for (const validationError of error.errors) {
          this.schemaValidationErrors.push(this._formatValidationError(validationError));
        }
      } else {
        throw error;
      }
    }
  }

  async _validateAssetsAsync(data: any) {
    const assets: AssetField[] = [];
    visit(this.schema, data, (subSchema, value, path) => {
      const meta = subSchema.meta as Meta | undefined;
      if (path && meta?.asset) {
        assets.push({
          fieldPath: toFieldPath(path),
          data: value as string,
          meta,
        });
      }
    });
    await Promise.all(assets.map(this._validateAssetAsync.bind(this)));
  }

  async _validateImageAsync({ fieldPath, data, meta }: AssetField) {
    if (meta && meta.asset && data) {
      const { dimensions, square, contentTypePattern }: Meta = meta;
      // filePath could be an URL
      const filePath = path.resolve(this.rootDir, data);
      try {
        //  This cases on whether filePath is a remote URL or located on the machine
        const isLocalFile = fs.existsSync(filePath);
        const probeResult = isLocalFile
          ? await imageProbe(require('fs').createReadStream(filePath))
          : await imageProbe(data);

        if (!probeResult) {
          return;
        }

        const { width, height, type, mime } = probeResult;

        const fileExtension = filePath.split('.').pop();

        if (isLocalFile && mime !== `image/${fileExtension}`) {
          this.manualValidationErrors.push(
            new ValidationError({
              errorCode: 'FILE_EXTENSION_MISMATCH',
              fieldPath,
              message: `the file extension should match the content, but the file extension is .${fileExtension} while the file content at '${data}' is of type ${type}`,
              data,
              meta,
            })
          );
        }

        if (contentTypePattern && !mime.match(new RegExp(contentTypePattern))) {
          this.manualValidationErrors.push(
            new ValidationError({
              errorCode: 'INVALID_CONTENT_TYPE',
              fieldPath,
              message: `field '${fieldPath}' should point to ${meta.contentTypeHuman} but the file at '${data}' has type ${type}`,
              data,
              meta,
            })
          );
        }

        if (dimensions && (dimensions.height !== height || dimensions.width !== width)) {
          this.manualValidationErrors.push(
            new ValidationError({
              errorCode: 'INVALID_DIMENSIONS',
              fieldPath,
              message: `'${fieldPath}' should have dimensions ${dimensions.width}x${dimensions.height}, but the file at '${data}' has dimensions ${width}x${height}`,
              data,
              meta,
            })
          );
        }

        if (square && width !== height) {
          this.manualValidationErrors.push(
            new ValidationError({
              errorCode: 'NOT_SQUARE',
              fieldPath,
              message: `image should be square, but the file at '${data}' has dimensions ${width}x${height}`,
              data,
              meta,
            })
          );
        }
      } catch {
        this.manualValidationErrors.push(
          new ValidationError({
            errorCode: 'INVALID_ASSET_URI',
            fieldPath,
            message: `cannot access file at '${data}'`,
            data,
            meta,
          })
        );
      }
    }
  }

  async _validateDirectoryAsync({ fieldPath, data, meta }: AssetField) {
    if (meta && meta.asset && data) {
      const filePath = path.resolve(this.rootDir, data);

      try {
        if (!fs.existsSync(filePath)) {
          this.manualValidationErrors.push(
            new ValidationError({
              errorCode: 'INVALID_ASSET_URI',
              fieldPath,
              message: `directory does not exist at '${data}'`,
              data,
              meta,
            })
          );
          return;
        }

        if (!fs.lstatSync(filePath).isDirectory()) {
          this.manualValidationErrors.push(
            new ValidationError({
              errorCode: 'INVALID_CONTENT_TYPE',
              fieldPath,
              message: `field '${fieldPath}' should point to ${meta.contentTypeHuman} but the path at '${data}' is not a directory`,
              data,
              meta,
            })
          );
        }
      } catch {
        this.manualValidationErrors.push(
          new ValidationError({
            errorCode: 'INVALID_ASSET_URI',
            fieldPath,
            message: `cannot access directory at '${data}'`,
            data,
            meta,
          })
        );
      }
    }
  }

  async _validateAssetAsync({ fieldPath, data, meta }: AssetField) {
    if (meta && meta.asset && data) {
      if (meta.contentTypePattern && meta.contentTypePattern.startsWith('^image')) {
        await this._validateImageAsync({ fieldPath, data, meta });
      } else if (meta.contentTypePattern === 'directory') {
        await this._validateDirectoryAsync({ fieldPath, data, meta });
      }
    }
  }
}
