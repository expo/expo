import {
  validate,
  visit,
  ValidationError as SchemaValidationError,
  JSONSchema,
} from '@expo/schema-utils';
import fs from 'fs';
import path from 'path';
import imageProbe from 'probe-image-size';

import { SchemerError, ValidationError } from './Error';

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

function pathToFieldPath(schemaUtilsPath: string): string {
  return schemaUtilsPath.replace(/\[(\d+)\]/g, '.$1').replace(/^\./, '');
}

// `required`/`additionalProperties` errors append the offending key to the path;
// the field path excludes it and the message names it instead.
function splitLastSegment(fieldPath: string): { parentPath: string; key: string } {
  const index = fieldPath.lastIndexOf('.');
  return index === -1
    ? { parentPath: '', key: fieldPath }
    : { parentPath: fieldPath.slice(0, index), key: fieldPath.slice(index + 1) };
}

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
    const fieldPath = pathToFieldPath(path);
    switch (keyword) {
      case 'additionalProperties': {
        const { parentPath, key } = splitLastSegment(fieldPath);
        return new ValidationError({
          errorCode: 'SCHEMA_ADDITIONAL_PROPERTY',
          fieldPath: parentPath,
          message: `should NOT have additional property '${key}'`,
          data: value,
          meta: undefined,
        });
      }
      case 'required': {
        const { parentPath, key } = splitLastSegment(fieldPath);
        return new ValidationError({
          errorCode: 'SCHEMA_MISSING_REQUIRED_PROPERTY',
          fieldPath: parentPath,
          message: `is missing required property '${key}'`,
          data: value,
          meta: undefined,
        });
      }
      case 'pattern':
        return new ValidationError({
          errorCode: 'SCHEMA_INVALID_PATTERN',
          fieldPath,
          message: `'${fieldPath}' ${message}`,
          data: value,
          meta: undefined,
        });
      case 'not':
        return new ValidationError({
          errorCode: 'SCHEMA_INVALID_NOT',
          fieldPath,
          message: `'${fieldPath}' ${message}`,
          data: value,
          meta: undefined,
        });
      default:
        return new ValidationError({
          errorCode: 'SCHEMA_VALIDATION_ERROR',
          fieldPath,
          message: message || 'Validation error',
          data: value,
          meta: undefined,
        });
    }
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
    this._validateSchema(this.schema, data);
    await this._validateAssetsAsync(data);
    this._throwOnErrors();
  }

  async validateAssetsAsync(data: any) {
    await this._validateAssetsAsync(data);
    this._throwOnErrors();
  }

  async validateSchemaAsync(data: any) {
    this._validateSchema(this.schema, data);
    this._throwOnErrors();
  }

  _validateSchema(schema: JSONSchema, data: any) {
    try {
      validate(schema, data);
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
          fieldPath: pathToFieldPath(path),
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
