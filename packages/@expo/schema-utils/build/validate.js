"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateSchema = void 0;
const getValueType = value => {
  const typeOf = typeof value;
  switch (typeOf) {
    case 'number':
      return Number.isInteger(value) ? 'integer' : 'number';
    case 'boolean':
    case 'string':
      return typeOf;
    case 'object':
      if (value === null) {
        return 'null';
      } else if (Array.isArray(value)) {
        return 'array';
      } else {
        return 'object';
      }
    default:
      return typeOf;
  }
};
const isDeepEqual = (a, b) => {
  if (a === b) {
    return true;
  } else if (a === null || b === null) {
    return false;
  } else if (typeof a !== typeof b) {
    return false;
  } else if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    for (let idx = 0; idx < a.length; idx++) {
      if (!isDeepEqual(a[idx], b[idx])) return false;
    }
    return true;
  } else if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (!isDeepEqual(keysA, keysB)) {
      return false;
    }
    for (let idx = 0; idx < keysA.length; idx++) {
      if (!isDeepEqual(a[keysA[idx]], b[keysA[idx]])) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
};
const areArrayValuesUnique = array => {
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length; j++) {
      if (i !== j && isDeepEqual(array[i], array[j])) {
        return false;
      }
    }
  }
  return true;
};
const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const dateTimeRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
const timeRe = /^\d{2}:\d{2}:\d{2}$/;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hostnameRe = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const uriRe = /^https?:\/\//;
const validateFormat = (format, value) => {
  // NOTE: Left out ipv4 and ipv6
  switch (format) {
    case 'date-time':
      return dateTimeRe.test(value);
    case 'date':
      return dateRe.test(value);
    case 'time':
      return timeRe.test(value);
    case 'email':
      return emailRe.test(value);
    case 'hostname':
      return hostnameRe.test(value);
    case 'uri':
      return uriRe.test(value);
    default:
      throw new TypeError(`Unsupported format "${format}"`);
  }
};
const isEnumValue = (enumValues, value) => {
  if (!enumValues.length) {
    throw new TypeError('Empty enum array');
  }
  for (let idx = 0; idx < enumValues.length; idx++) {
    if (isDeepEqual(value, enumValues[idx])) {
      return true;
    }
  }
  return false;
};
const validateString = (schema, value, path) => {
  if (schema.minLength != null && value.length < schema.minLength) {
    return {
      message: `String must be at least ${schema.minLength} characters`,
      keyword: 'minLength',
      path,
      value
    };
  } else if (schema.maxLength != null && value.length > schema.maxLength) {
    return {
      message: `String must be at most ${schema.maxLength} characters`,
      keyword: 'maxLength',
      path,
      value
    };
  } else if (schema.pattern != null && !new RegExp(schema.pattern).test(value)) {
    return {
      message: `String does not match pattern: ${schema.pattern}`,
      keyword: 'pattern',
      path,
      value
    };
  } else if (schema.format != null && !validateFormat(schema.format, value)) {
    return {
      message: `String does not match format: ${schema.format}`,
      keyword: 'format',
      path,
      value
    };
  } else {
    return null;
  }
};
const validateNumber = (schema, value, path) => {
  if (schema.multipleOf != null && value % schema.multipleOf !== 0) {
    return {
      message: `Number must be multiple of ${schema.multipleOf}`,
      keyword: 'multipleOf',
      path,
      value
    };
  } else if (schema.minimum != null && value < schema.minimum) {
    return {
      message: `Number must be equal or greater than ${schema.minimum}`,
      keyword: 'minimum',
      path,
      value
    };
  } else if (schema.maximum != null && value > schema.maximum) {
    return {
      message: `Number must be equal or less than ${schema.maximum}`,
      keyword: 'maximum',
      path,
      value
    };
  } else if (schema.exclusiveMaximum === true && schema.maximum != null && value >= schema.maximum) {
    return {
      message: `Number must be less than ${schema.maximum}`,
      keyword: 'exclusiveMaximum',
      path,
      value
    };
  } else if (typeof schema.exclusiveMaximum === 'number' && value >= schema.exclusiveMaximum) {
    return {
      message: `Number must be less than ${schema.exclusiveMaximum}`,
      keyword: 'exclusiveMaximum',
      path,
      value
    };
  } else if (schema.exclusiveMinimum === true && schema.minimum != null && value <= schema.minimum) {
    return {
      message: `Number must be greater than ${schema.minimum}`,
      keyword: 'exclusiveMinimum',
      path,
      value
    };
  } else if (typeof schema.exclusiveMinimum === 'number' && value <= schema.exclusiveMinimum) {
    return {
      message: `Number must be greater than ${schema.exclusiveMinimum}`,
      keyword: 'exclusiveMinimum',
      path,
      value
    };
  } else {
    return null;
  }
};
const validateContains = (containsSchema, value, path) => {
  for (let idx = 0; idx < value.length; idx++) {
    if (validateSchema(containsSchema, value[idx], path) === null) {
      return null;
    }
  }
  return {
    message: 'Array must contain at least one item matching the contains schema',
    keyword: 'contains',
    path,
    value
  };
};
const validateItems = (itemsSchema, additionalItems, value, path) => {
  let child;
  if (Array.isArray(itemsSchema)) {
    let idx = 0;
    for (idx = 0; idx < itemsSchema.length; idx++) {
      if ((child = validateSchema(itemsSchema[idx], value[idx], `${path}[${idx}]`)) != null) {
        return child;
      }
    }
    if (idx < value.length) {
      if (additionalItems === true) {
        return null;
      } else if (additionalItems) {
        for (; idx < value.length; idx++) {
          if ((child = validateSchema(additionalItems, value[idx], `${path}[${idx}]`)) != null) {
            return child;
          }
        }
        return null;
      } else {
        return {
          message: `Array contained ${value.length - idx} more items than items schema`,
          keyword: 'additionalItems',
          path,
          value
        };
      }
    } else {
      return null;
    }
  } else {
    for (let idx = 0; idx < value.length; idx++) {
      if ((child = validateSchema(itemsSchema, value[idx], `${path}[${idx}]`)) != null) {
        return child;
      }
    }
    return null;
  }
};
const validateArray = (schema, value, path) => {
  let child;
  if (schema.minItems != null && value.length < schema.minItems) {
    return {
      message: `Array must have at least ${schema.minItems} items`,
      keyword: 'minItems',
      path,
      value
    };
  } else if (schema.maxItems != null && value.length > schema.maxItems) {
    return {
      message: `Array must have at most ${schema.maxItems} items`,
      keyword: 'maxItems',
      path,
      value
    };
  } else if (schema.uniqueItems && !areArrayValuesUnique(value)) {
    return {
      message: 'Array items must be unique',
      keyword: 'uniqueItems',
      path,
      value
    };
  } else if (schema.contains != null && (child = validateContains(schema.contains, value, path)) != null) {
    return child;
  } else if (schema.items != null && (child = validateItems(schema.items, schema.additionalItems, value, path)) != null) {
    return child;
  } else {
    return null;
  }
};
const validateRequired = (keys, value, path) => {
  for (let idx = 0; idx < keys.length; idx++) {
    if (value[keys[idx]] === undefined) {
      return {
        message: `Required property "${keys[idx]}" is missing`,
        keyword: 'required',
        path: `${path}.${keys[idx]}`,
        value
      };
    }
  }
  return null;
};
const validateProperties = (properties, value, path) => {
  let child;
  for (const key in properties) {
    if (value[key] !== undefined && (child = validateSchema(properties[key], value[key], `${path}.${key}`)) != null) {
      return child;
    }
  }
  return null;
};
const validatePatternProperties = (validatedProperties, patternProperties, keys, value, path) => {
  let child;
  for (const pattern in patternProperties) {
    const propertyRe = new RegExp(pattern);
    for (let idx = 0; idx < keys.length; idx++) {
      const key = keys[idx];
      const childSchema = patternProperties[pattern];
      if (propertyRe.test(key)) {
        validatedProperties.add(key);
        if ((child = validateSchema(childSchema, value[key], `${path}.${key}`)) != null) {
          return child;
        }
      }
    }
  }
  return null;
};
const validateAdditionalProperties = (additionalProperties, properties, visitedPatternProperties, keys, value, path) => {
  if (additionalProperties === true) {
    return null;
  }
  let child;
  for (let idx = 0; idx < keys.length; idx++) {
    const key = keys[idx];
    if (!visitedPatternProperties.has(key) && !properties?.[key]) {
      if (additionalProperties === false) {
        return {
          message: `Additional property "${key}" is not allowed`,
          keyword: 'additionalProperties',
          path: `${path}.${key}`,
          value: value[key]
        };
      } else if ((child = validateSchema(additionalProperties, value[key], `${path}.${key}`)) != null) {
        return child;
      }
    }
  }
  return null;
};
const validatePropertyNames = (propertyNames, keys, path) => {
  let child;
  for (let idx = 0; idx < keys.length; idx++) {
    const key = keys[idx];
    if ((child = validateString(propertyNames, key, `${path}.${key}`)) != null) {
      child.message = `Property name "${key}" does not match schema. ${child.message}`;
      return child;
    }
  }
  return null;
};
const validateDependencies = (dependencies, value, path) => {
  let child;
  for (const key in dependencies) {
    if (value[key] !== undefined) {
      if (Array.isArray(dependencies[key])) {
        for (let idx = 0; idx < dependencies[key].length; idx++) {
          if (value[dependencies[key][idx]] === undefined) {
            return {
              message: `Property "${dependencies[key][idx]}" is required when "${key}" is present`,
              keyword: 'dependencies',
              path: `${path}.${dependencies[key][idx]}`,
              value: undefined
            };
          }
        }
      } else if (dependencies[key] != null && (child = validateSchema(dependencies[key], value, path)) != null) {
        return child;
      }
    }
  }
  return null;
};
const validateObject = (schema, value, path) => {
  const keys = Object.keys(value);
  const visitedPatternProperties = new Set();
  let child;
  if (schema.minProperties != null && keys.length < schema.minProperties) {
    return {
      message: `Object must have at least ${schema.minProperties} properties`,
      keyword: 'minProperties',
      path,
      value
    };
  } else if (schema.maxProperties != null && keys.length > schema.maxProperties) {
    return {
      message: `Object must have at most ${schema.maxProperties} properties`,
      keyword: 'maxProperties',
      path,
      value
    };
  } else if (schema.required != null && (child = validateRequired(schema.required, value, path)) != null) {
    return child;
  } else if (schema.properties != null && (child = validateProperties(schema.properties, value, path)) != null) {
    return child;
  } else if (schema.patternProperties != null && (child = validatePatternProperties(visitedPatternProperties, schema.patternProperties, keys, value, path)) != null) {
    return child;
  } else if (schema.additionalProperties != null && (child = validateAdditionalProperties(schema.additionalProperties, schema.properties, visitedPatternProperties, keys, value, path)) != null) {
    return child;
  } else if (schema.propertyNames != null && (child = validatePropertyNames(schema.propertyNames, keys, path)) != null) {
    return child;
  } else if (schema.dependencies != null && (child = validateDependencies(schema.dependencies, value, path)) != null) {
    return child;
  } else {
    return null;
  }
};
const validateType = (schemaType, valueType, path) => {
  if (Array.isArray(schemaType)) {
    if (valueType === 'integer' && schemaType.includes('number')) {
      return null;
    }
    return !schemaType.includes(valueType) ? {
      message: `Expected type ${schemaType.join(' or ')}, got ${valueType}`,
      keyword: 'type',
      path,
      value: undefined
    } : null;
  } else {
    if (valueType === 'integer' && schemaType === 'number') {
      return null;
    }
    return schemaType !== valueType ? {
      message: `Expected type ${schemaType}, got ${valueType}`,
      keyword: 'type',
      path,
      value: undefined
    } : null;
  }
};
const validateAllOf = (schemas, value, path) => {
  let child;
  for (let idx = 0; idx < schemas.length; idx++) {
    if ((child = validateSchema(schemas[idx], value, path)) != null) {
      return child;
    }
  }
  return null;
};
const validateAnyOf = (schemas, value, path) => {
  let child;
  const cause = [];
  for (let idx = 0; idx < schemas.length; idx++) {
    if ((child = validateSchema(schemas[idx], value, path)) != null) {
      cause.push(child);
    } else {
      return null;
    }
  }
  return {
    message: 'No schema matched anyOf type',
    keyword: 'anyOf',
    path,
    value,
    cause
  };
};
const validateOneOf = (schemas, value, path) => {
  let child;
  const cause = [];
  for (let idx = 0; idx < schemas.length; idx++) {
    if ((child = validateSchema(schemas[idx], value, path)) != null) {
      cause.push(child);
    }
  }
  if (cause.length >= schemas.length) {
    return {
      message: 'Value does not match any of the oneOf schemas',
      keyword: 'oneOf',
      path,
      value,
      cause
    };
  } else if (cause.length < schemas.length - 1) {
    return {
      message: `Value matches ${schemas.length - cause.length} schemas, but exactly one is required`,
      keyword: 'oneOf',
      path,
      value,
      cause
    };
  } else {
    return null;
  }
};
const validateConditional = (ifSchema, thenSchema, elseSchema, value, path) => {
  let child;
  if (validateSchema(ifSchema, value, path) != null) {
    if (elseSchema != null && (child = validateSchema(elseSchema, value, path)) != null) {
      return {
        message: 'Value does not match "else" schema but did not match "if" condition schema',
        keyword: 'else',
        path,
        value,
        cause: [child]
      };
    } else {
      return null;
    }
  } else if (thenSchema != null && (child = validateSchema(thenSchema, value, path)) != null) {
    return {
      message: 'Value does not match "then" schema but did match "if" condition schema',
      keyword: 'then',
      path,
      value,
      cause: [child]
    };
  } else {
    return null;
  }
};
const validateSchema = (schema, value, path) => {
  if (typeof schema === 'boolean') {
    // Draft 07: Schemas can be booleans
    return !schema ? {
      message: 'Schema is false',
      keyword: 'schema',
      path,
      value: undefined
    } : null;
  }
  const valueType = getValueType(value);
  let child;
  if (schema.type !== undefined && (child = validateType(schema.type, valueType, path)) != null) {
    return child;
  } else if (schema.const !== undefined && !isDeepEqual(value, schema.const)) {
    return {
      message: `Value must be equal to ${JSON.stringify(schema.const)}`,
      keyword: 'const',
      path,
      value
    };
  } else if (schema.enum != null && !isEnumValue(schema.enum, value)) {
    return {
      message: `Value must be one of ${JSON.stringify(schema.enum)}`,
      keyword: 'enum',
      path,
      value
    };
  } else if (schema.allOf != null && (child = validateAllOf(schema.allOf, value, path)) != null) {
    return child;
  } else if (schema.anyOf != null && (child = validateAnyOf(schema.anyOf, value, path)) != null) {
    return child;
  } else if (schema.oneOf != null && (child = validateOneOf(schema.oneOf, value, path)) != null) {
    return child;
  } else if (schema.not != null && validateSchema(schema.not, value, path) == null) {
    return {
      message: 'Value matches the not schema, but should not',
      keyword: 'not',
      path,
      value
    };
  } else if (schema.if != null && (schema.then != null || schema.else != null) && (child = validateConditional(schema.if, schema.then, schema.else, value, path)) != null) {
    return child;
  }
  switch (valueType) {
    case 'string':
      return validateString(schema, value, path);
    case 'number':
    case 'integer':
      return validateNumber(schema, value, path);
    case 'array':
      return validateArray(schema, value, path);
    case 'object':
      return validateObject(schema, value, path);
    default:
      return null;
  }
};
exports.validateSchema = validateSchema;
//# sourceMappingURL=validate.js.map