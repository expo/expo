import Ajv, { ErrorObject, Options } from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import traverse from 'json-schema-traverse';
import get from 'lodash/get';
import path from 'path';
import imageProbe from 'probe-image-size';

import { SchemerError, ValidationError } from './Error';
import { fieldPathToSchema, schemaPointerToFieldPath } from './Util';

function lowerFirst(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

type Meta = {
  asset?: boolean;
  dimensions?: {
    width: number;
    height: number;
  };
  square?: boolean;
  contentTypePattern?: string;
  contentTypeHuman?: string;
};

type SchemerOptions = Options & {
  rootDir?: string;
};

type AssetField = { fieldPath: string; data: string; meta: Meta };

export { SchemerError, ValidationError, ErrorCodes, ErrorCode } from './Error';
export default class Schemer {
  options: SchemerOptions;
  ajv: Ajv;
  schema: object;
  rootDir: string;
  manualValidationErrors: ValidationError[];
  // Schema is a JSON Schema object
  constructor(schema: object, options: SchemerOptions = {}) {
    this.options = {
      allErrors: true,
      verbose: true,
      meta: true,
      strict: false,
      unicodeRegExp: false,
      ...options,
    };

    this.ajv = new Ajv(this.options);
    addFormats(this.ajv, { mode: 'full' });
    this.schema = schema;
    this.rootDir = this.options.rootDir || __dirname;
    this.manualValidationErrors = [];
  }

  _formatAjvErrorMessage({
    keyword,
    instancePath,
    params,
    parentSchema,
    data,
    message,
  }: ErrorObject) {
    const meta = parentSchema && (parentSchema as any).meta;
    // This removes the "." in front of a fieldPath
    instancePath = instancePath.slice(1);
    switch (keyword) {
      case 'additionalProperties': {
        return new ValidationError({
          errorCode: 'SCHEMA_ADDITIONAL_PROPERTY',
          fieldPath: instancePath,
          message: `should NOT have additional property '${(params as any).additionalProperty}'`,
          data,
          meta,
        });
      }
      case 'required':
        return new ValidationError({
          errorCode: 'SCHEMA_MISSING_REQUIRED_PROPERTY',
          fieldPath: instancePath,
          message: `is missing required property '${(params as any).missingProperty}'`,
          data,
          meta,
        });
      case 'pattern': {
        //@TODO Parse the message in a less hacky way. Perhaps for regex validation errors, embed the error message under the meta tag?
        const regexHuman = meta?.regexHuman;
        const regexErrorMessage = regexHuman
          ? `'${instancePath}' should be a ${regexHuman[0].toLowerCase() + regexHuman.slice(1)}`
          : `'${instancePath}' ${message}`;
        return new ValidationError({
          errorCode: 'SCHEMA_INVALID_PATTERN',
          fieldPath: instancePath,
          message: regexErrorMessage,
          data,
          meta,
        });
      }
      case 'not': {
        const notHuman = meta?.notHuman;
        const notHumanErrorMessage = notHuman
          ? `'${instancePath}' should be ${notHuman[0].toLowerCase() + notHuman.slice(1)}`
          : `'${instancePath}' ${message}`;
        return new ValidationError({
          errorCode: 'SCHEMA_INVALID_NOT',
          fieldPath: instancePath,
          message: notHumanErrorMessage,
          data,
          meta,
        });
      }
      default:
        return new ValidationError({
          errorCode: 'SCHEMA_VALIDATION_ERROR',
          fieldPath: instancePath,
          message: message || 'Validation error',
          data,
          meta,
        });
    }
  }

  getErrors(): ValidationError[] {
    // Convert AJV JSONSchema errors to our ValidationErrors
    let valErrors: ValidationError[] = [];
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
      throw new SchemerError(errors);
    }
  }

  async validateAll(data: any) {
    await this._validateSchemaAsync(data);
    await this._validateAssetsAsync(data);
    this._throwOnErrors();
  }

  async validateAssetsAsync(data: any) {
    await this._validateAssetsAsync(data);
    this._throwOnErrors();
  }

  async validateSchemaAsync(data: any) {
    await this._validateSchemaAsync(data);
    this._throwOnErrors();
  }

  _validateSchemaAsync(data: any) {
    this.ajv.validate(this.schema, data);
  }

  async _validateAssetsAsync(data: any) {
    const assets: AssetField[] = [];
    traverse(this.schema, { allKeys: true }, (subSchema, jsonPointer, a, b, c, d, property) => {
      if (property && subSchema.meta && subSchema.meta.asset) {
        const fieldPath = schemaPointerToFieldPath(jsonPointer);
        assets.push({
          fieldPath,
          data: get(data, lowerFirst(fieldPath)) || get(data, fieldPath),
          meta: subSchema.meta,
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
          : await imageProbe(data, { useElectronNet: false });

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

  async _validateAssetAsync({ fieldPath, data, meta }: AssetField) {
    if (meta && meta.asset && data) {
      if (meta.contentTypePattern && meta.contentTypePattern.startsWith('^image')) {
        await this._validateImageAsync({ fieldPath, data, meta });
      }
    }
  }

  async validateProperty(fieldPath: string, data: any) {
    const subSchema = fieldPathToSchema(this.schema, fieldPath);
    this.ajv.validate(subSchema, data);

    if (subSchema.meta && subSchema.meta.asset) {
      await this._validateAssetAsync({ fieldPath, data, meta: subSchema.meta });
    }
    this._throwOnErrors();
  }

  validateName(name: string) {
    return this.validateProperty('name', name);
  }

  validateSlug(slug: string) {
    return this.validateProperty('slug', slug);
  }

  validateSdkVersion(version: string) {
    return this.validateProperty('sdkVersion', version);
  }

  validateIcon(iconPath: string) {
    return this.validateProperty('icon', iconPath);
  }
}
