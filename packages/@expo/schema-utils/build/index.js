"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "JSONSchema", {
  enumerable: true,
  get: function () {
    return _JSONSchema().JSONSchema;
  }
});
exports.ValidationError = void 0;
exports.derefSchema = derefSchema;
exports.validate = validate;
function _deref() {
  const data = require("./deref");
  _deref = function () {
    return data;
  };
  return data;
}
function _validate() {
  const data = require("./validate");
  _validate = function () {
    return data;
  };
  return data;
}
function _JSONSchema() {
  const data = require("./JSONSchema");
  _JSONSchema = function () {
    return data;
  };
  return data;
}
const CACHE_SYMBOL = Symbol('@expo/schema-utils');
const flattenValidationResults = (input, output = []) => {
  output.push({
    message: input.message,
    path: input.path,
    keyword: input.keyword,
    value: input.value
  });
  for (let idx = 0; input.cause && idx < input.cause.length; idx++) {
    flattenValidationResults(input.cause[idx], output);
  }
  return output;
};
const toErrorsMessages = errors => errors.map(error => {
  return `\n - options${error.path} (${error.keyword}): ${error.message}`;
});
class ValidationError extends Error {
  constructor(result, schema) {
    const errors = flattenValidationResults(result);
    const title = typeof schema.title === 'string' ? schema.title : 'Value';
    super(`Invalid options object. ${title} options object does not match the defined schema.\n` + toErrorsMessages(errors).map(line => ` - options${line}`).join('\n'));
    this.name = 'ValidationError';
    this.errors = errors;
    this.schema = schema;
  }
  toErrorsMessage() {
    return toErrorsMessages(this.errors);
  }
}
exports.ValidationError = ValidationError;
const derefSchemaCache = schema => {
  let derefed = schema[CACHE_SYMBOL];
  if (!derefed) {
    derefed = {
      schema: (0, _deref().deref)(schema),
      cache: new WeakMap()
    };
    schema[CACHE_SYMBOL] = derefed;
  }
  return derefed;
};
function derefSchema(schema) {
  return derefSchemaCache(schema).schema;
}
function validate(schema, value) {
  const data = derefSchemaCache(schema);
  let result;
  if (typeof value !== 'object' || value == null || (result = data.cache.get(value)) === undefined) {
    result = (0, _validate().validateSchema)(data.schema, value, '');
    if (typeof value === 'object' && value != null) {
      data.cache.set(value, result);
    }
  }
  if (result) {
    throw new ValidationError(result, data.schema);
  }
}
//# sourceMappingURL=index.js.map