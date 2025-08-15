import { validateSchema } from '../validate';

it('should work with an empty schema', () => {
  expect(validateSchema({}, {}, '')).toEqual(null);
});

describe('type', () => {
  it.each([
    [{ type: 'number' }, 1.2],
    [{ type: 'number' }, 1],
    [{ type: 'integer' }, 1],
    [{ type: 'array' }, []],
    [{ type: 'object' }, {}],
    [{ type: 'string' }, ''],
    [{ type: 'null' }, null],
  ])('should match %s type', (schema, value) => {
    expect(validateSchema(schema as any, value, '')).toEqual(null);
    expect(validateSchema(schema as any, value === null ? {} : null, '')).not.toEqual(null);
  });
});

describe('multipleOf', () => {
  it('should work with a multiple of number', () => {
    expect(validateSchema({ multipleOf: 2 }, 4, '')).toEqual(null);
    expect(validateSchema({ multipleOf: 2 }, 3, '')).toMatchInlineSnapshot(`
      {
        "keyword": "multipleOf",
        "message": "Number must be multiple of 2",
        "path": "",
        "value": 3,
      }
    `);
  });
});

describe('minimum', () => {
  it('should work with a minimum of number', () => {
    expect(validateSchema({ minimum: 2 }, 3, '')).toEqual(null);
    expect(validateSchema({ minimum: 2 }, 2, '')).toEqual(null);
    expect(validateSchema({ minimum: 2 }, 1, '')).toMatchInlineSnapshot(`
      {
        "keyword": "minimum",
        "message": "Number must be equal or greater than 2",
        "path": "",
        "value": 1,
      }
    `);
  });

  it('should work with an exclusive minimum of number', () => {
    expect(validateSchema({ minimum: 2, exclusiveMinimum: true }, 3, '')).toEqual(null);
    expect(validateSchema({ minimum: 2, exclusiveMinimum: true }, 2, '')).toMatchInlineSnapshot(`
      {
        "keyword": "exclusiveMinimum",
        "message": "Number must be greater than 2",
        "path": "",
        "value": 2,
      }
    `);
    expect(validateSchema({ exclusiveMinimum: 2 as any }, 3, '')).toEqual(null);
    expect(validateSchema({ exclusiveMinimum: 2 as any }, 2, '')).toMatchInlineSnapshot(`
      {
        "keyword": "exclusiveMinimum",
        "message": "Number must be greater than 2",
        "path": "",
        "value": 2,
      }
    `);
  });
});

describe('maximum', () => {
  it('should work with a maximum of number', () => {
    expect(validateSchema({ maximum: 2 }, 1, '')).toEqual(null);
    expect(validateSchema({ maximum: 2 }, 2, '')).toEqual(null);
    expect(validateSchema({ maximum: 2 }, 3, '')).toMatchInlineSnapshot(`
      {
        "keyword": "maximum",
        "message": "Number must be equal or less than 2",
        "path": "",
        "value": 3,
      }
    `);
  });

  it('should work with an exclusive maximum of number', () => {
    expect(validateSchema({ exclusiveMaximum: 2 as any }, 1, '')).toEqual(null);
    expect(validateSchema({ exclusiveMaximum: 2 as any }, 2, '')).toMatchInlineSnapshot(`
      {
        "keyword": "exclusiveMaximum",
        "message": "Number must be less than 2",
        "path": "",
        "value": 2,
      }
    `);
  });
});

describe('enum', () => {
  it('should match enum entry', () => {
    expect(validateSchema({ enum: ['test'] }, 'test', '')).toEqual(null);
    expect(validateSchema({ enum: [1] }, 1, '')).toEqual(null);
    expect(validateSchema({ enum: [1, 2] }, 2, '')).toEqual(null);
    expect(validateSchema({ enum: [{ test: true }] }, { test: true }, '')).toEqual(null);
    expect(validateSchema({ enum: [{ test: true }] }, { test: false }, '')).toMatchInlineSnapshot(`
      {
        "keyword": "enum",
        "message": "Value must be one of [{"test":true}]",
        "path": "",
        "value": {
          "test": false,
        },
      }
    `);
  });
});

describe('contains', () => {
  it('should match an array item', () => {
    expect(validateSchema({ contains: { type: 'number' } }, [1], '')).toEqual(null);
    expect(validateSchema({ contains: { type: 'number' } }, [null, 1], '')).toEqual(null);
    expect(validateSchema({ contains: { type: 'number' } }, ['string'], '')).toMatchInlineSnapshot(`
      {
        "keyword": "contains",
        "message": "Array must contain at least one item matching the contains schema",
        "path": "",
        "value": [
          "string",
        ],
      }
    `);
  });
});

describe('items', () => {
  it('should match items', () => {
    expect(validateSchema({ items: { type: 'number' } }, [1, 2], '')).toEqual(null);
    expect(validateSchema({ items: { type: 'number' } }, [null, 1], '')).toMatchInlineSnapshot(`
      {
        "keyword": "type",
        "message": "Expected type number, got null",
        "path": "[0]",
        "value": undefined,
      }
    `);
  });

  it('should match items tuple', () => {
    expect(validateSchema({ items: [{ type: 'number' }] }, [1], '')).toEqual(null);
    expect(validateSchema({ items: [{ type: 'number' }] }, [null], '')).toMatchInlineSnapshot(`
      {
        "keyword": "type",
        "message": "Expected type number, got null",
        "path": "[0]",
        "value": undefined,
      }
    `);
  });

  it('should not allow additional items', () => {
    expect(
      validateSchema({ items: [{ type: 'number' }], additionalItems: true }, [1, 2], '')
    ).toEqual(null);
    expect(validateSchema({ items: [{ type: 'number' }] }, [1, 2], '')).toMatchInlineSnapshot(`
      {
        "keyword": "additionalItems",
        "message": "Array contained 1 more items than items schema",
        "path": "",
        "value": [
          1,
          2,
        ],
      }
    `);
    expect(validateSchema({ items: [{ type: 'number' }], additionalItems: false }, [1, 2], ''))
      .toMatchInlineSnapshot(`
      {
        "keyword": "additionalItems",
        "message": "Array contained 1 more items than items schema",
        "path": "",
        "value": [
          1,
          2,
        ],
      }
    `);
  });

  it('should allow additional items matching schema', () => {
    expect(
      validateSchema(
        { items: [{ type: 'number' }], additionalItems: { type: 'null' } },
        [1, null],
        ''
      )
    ).toEqual(null);
    expect(
      validateSchema({ items: [{ type: 'number' }], additionalItems: { type: 'null' } }, [1, 2], '')
    ).toMatchInlineSnapshot(`
      {
        "keyword": "type",
        "message": "Expected type null, got integer",
        "path": "[1]",
        "value": undefined,
      }
    `);
  });
});

describe('minItems', () => {
  it('should work with a minimum amount of entries', () => {
    expect(validateSchema({ minItems: 2 }, [1, 2, 3], '')).toEqual(null);
    expect(validateSchema({ minItems: 2 }, [1, 2], '')).toEqual(null);
    expect(validateSchema({ minItems: 2 }, [1], '')).toMatchInlineSnapshot(`
      {
        "keyword": "minItems",
        "message": "Array must have at least 2 items",
        "path": "",
        "value": [
          1,
        ],
      }
    `);
  });
});

describe('maxItems', () => {
  it('should work with a maximum amount of entries', () => {
    expect(validateSchema({ maxItems: 2 }, [1], '')).toEqual(null);
    expect(validateSchema({ maxItems: 2 }, [1, 2], '')).toEqual(null);
    expect(validateSchema({ maxItems: 2 }, [1, 2, 3], '')).toMatchInlineSnapshot(`
      {
        "keyword": "maxItems",
        "message": "Array must have at most 2 items",
        "path": "",
        "value": [
          1,
          2,
          3,
        ],
      }
    `);
  });
});

describe('uniqueItems', () => {
  it('should require unique items', () => {
    expect(validateSchema({ uniqueItems: true }, [1], '')).toEqual(null);
    expect(validateSchema({ uniqueItems: true }, [1, 2], '')).toEqual(null);
    expect(validateSchema({ uniqueItems: true }, [1, 1], '')).toMatchInlineSnapshot(`
      {
        "keyword": "uniqueItems",
        "message": "Array items must be unique",
        "path": "",
        "value": [
          1,
          1,
        ],
      }
    `);
  });
});

describe('required', () => {
  it('should validated required properties', () => {
    expect(validateSchema({ required: ['x'] }, { x: true }, '')).toEqual(null);
    expect(validateSchema({ required: ['x'] }, { x: true, y: true }, '')).toEqual(null);
    expect(validateSchema({ required: ['x'] }, {}, '')).toMatchInlineSnapshot(`
      {
        "keyword": "required",
        "message": "Required property "x" is missing",
        "path": ".x",
        "value": {},
      }
    `);
  });
});

describe('properties', () => {
  it('should validate properties', () => {
    expect(validateSchema({ properties: { a: { type: 'number' } } }, { a: 1 }, '')).toEqual(null);
    expect(
      validateSchema(
        { properties: { a: { type: 'number' }, b: { type: 'null' } } },
        { a: 1, b: null },
        ''
      )
    ).toEqual(null);
    expect(validateSchema({ properties: { a: { type: 'number' } } }, {}, '')).toMatchInlineSnapshot(
      `null`
    );
  });
});

describe('patternProperties', () => {
  it('should validate properties', () => {
    expect(
      validateSchema({ patternProperties: { '\\w': { type: 'number' } } }, { a: 1 }, '')
    ).toEqual(null);
    expect(validateSchema({ patternProperties: { '\\w': { type: 'number' } } }, { a: 'x' }, ''))
      .toMatchInlineSnapshot(`
      {
        "keyword": "type",
        "message": "Expected type number, got string",
        "path": ".a",
        "value": undefined,
      }
    `);
  });
});

describe('additionalProperties', () => {
  it('does not allow additional properties', () => {
    expect(
      validateSchema({ properties: { a: {} }, additionalProperties: false }, { a: 1 }, '')
    ).toEqual(null);
    expect(
      validateSchema({ properties: { a: {} }, additionalProperties: false }, { a: 1, b: 2 }, '')
    ).toMatchInlineSnapshot(`
      {
        "keyword": "additionalProperties",
        "message": "Additional property "b" is not allowed",
        "path": ".b",
        "value": 2,
      }
    `);
  });

  it('does not allow additional properties / patternProperties', () => {
    expect(
      validateSchema(
        { properties: { test: {} }, patternProperties: { '\\w': {} }, additionalProperties: false },
        { a: 1, test: 1 },
        ''
      )
    ).toEqual(null);
    expect(
      validateSchema(
        {
          properties: { test: {} },
          patternProperties: { '^\\w$': {} },
          additionalProperties: false,
        },
        { a: 1, test: 1, add: true },
        ''
      )
    ).toMatchInlineSnapshot(`
      {
        "keyword": "additionalProperties",
        "message": "Additional property "add" is not allowed",
        "path": ".add",
        "value": true,
      }
    `);
  });

  it('validates additional properties', () => {
    expect(
      validateSchema(
        { properties: { test: {} }, additionalProperties: { type: 'number' } },
        { a: 1, test: 1 },
        ''
      )
    ).toEqual(null);
    expect(
      validateSchema(
        { properties: { test: {} }, additionalProperties: { type: 'number' } },
        { a: null, test: 1 },
        ''
      )
    ).toMatchInlineSnapshot(`
      {
        "keyword": "type",
        "message": "Expected type number, got null",
        "path": ".a",
        "value": undefined,
      }
    `);
  });
});

describe('dependencies', () => {
  it('specifies required dependency property names', () => {
    expect(validateSchema({ dependencies: { a: ['b'] } }, { a: 1, b: 2 }, '')).toEqual(null);
    expect(validateSchema({ dependencies: { a: ['b', 'c'] } }, { a: 1, b: 2, c: 3 }, '')).toEqual(
      null
    );
    expect(validateSchema({ dependencies: { a: ['b', 'c'] } }, { a: 1, b: 2 }, ''))
      .toMatchInlineSnapshot(`
      {
        "keyword": "dependencies",
        "message": "Property "c" is required when "a" is present",
        "path": ".c",
        "value": undefined,
      }
    `);
  });

  it('specifies required schema when property is set', () => {
    expect(
      validateSchema({ dependencies: { a: { required: ['b'] } } }, { a: 1, b: 2 }, '')
    ).toEqual(null);
    expect(validateSchema({ dependencies: { a: { required: ['b'] } } }, { a: 1, c: 2 }, ''))
      .toMatchInlineSnapshot(`
      {
        "keyword": "required",
        "message": "Required property "b" is missing",
        "path": ".b",
        "value": {
          "a": 1,
          "c": 2,
        },
      }
    `);
  });
});

describe('format', () => {
  it.each([
    ['date', '2025-01-01'],
    ['date-time', '2025-01-01T00:00:00.000Z'],
    ['time', '00:00:00'],
    ['email', 'test@expo.io'],
    ['hostname', 'expo.io'],
    ['uri', 'https://expo.io'],
  ])('should match %s format', (format, value) => {
    expect(validateSchema({ format }, value, '')).toEqual(null);
    expect(validateSchema({ format }, '', '')).not.toEqual(null);
  });
});

describe('minLength', () => {
  it('should work with a minimum length on a string', () => {
    expect(validateSchema({ minLength: 2 }, '123', '')).toEqual(null);
    expect(validateSchema({ minLength: 2 }, '12', '')).toEqual(null);
    expect(validateSchema({ minLength: 2 }, '1', '')).toMatchInlineSnapshot(`
      {
        "keyword": "minLength",
        "message": "String must be at least 2 characters",
        "path": "",
        "value": "1",
      }
    `);
  });
});

describe('maxLength', () => {
  it('should work with a maximum length on a string', () => {
    expect(validateSchema({ maxLength: 2 }, '1', '')).toEqual(null);
    expect(validateSchema({ maxLength: 2 }, '12', '')).toEqual(null);
    expect(validateSchema({ maxLength: 2 }, '123', '')).toMatchInlineSnapshot(`
      {
        "keyword": "maxLength",
        "message": "String must be at most 2 characters",
        "path": "",
        "value": "123",
      }
    `);
  });
});

describe('pattern', () => {
  it('should work with a regex pattern', () => {
    expect(validateSchema({ pattern: 'x' }, 'x', '')).toEqual(null);
    expect(validateSchema({ pattern: 'x' }, '', '')).toMatchInlineSnapshot(`
      {
        "keyword": "pattern",
        "message": "String does not match pattern: x",
        "path": "",
        "value": "",
      }
    `);
  });
});

describe('allOf', () => {
  it('requires all schemas to match', () => {
    expect(
      validateSchema({ allOf: [{ type: 'object' }, { required: ['a'] }] }, { a: true }, '')
    ).toEqual(null);
    expect(validateSchema({ allOf: [{ type: 'object' }, { required: ['a'] }] }, {}, ''))
      .toMatchInlineSnapshot(`
      {
        "keyword": "required",
        "message": "Required property "a" is missing",
        "path": ".a",
        "value": {},
      }
    `);
  });
});

describe('anyOf', () => {
  it('requires any schema to match', () => {
    expect(validateSchema({ anyOf: [{ type: 'object' }, { type: 'null' }] }, {}, '')).toEqual(null);
    expect(validateSchema({ anyOf: [{ type: 'object' }, { type: 'null' }] }, null, '')).toEqual(
      null
    );
    expect(validateSchema({ anyOf: [{ type: 'object' }, { type: 'null' }] }, 1, ''))
      .toMatchInlineSnapshot(`
      {
        "cause": [
          {
            "keyword": "type",
            "message": "Expected type object, got integer",
            "path": "",
            "value": undefined,
          },
          {
            "keyword": "type",
            "message": "Expected type null, got integer",
            "path": "",
            "value": undefined,
          },
        ],
        "keyword": "anyOf",
        "message": "No schema matched anyOf type",
        "path": "",
        "value": 1,
      }
    `);
  });
});

describe('oneOf', () => {
  it('requires a single schema to match', () => {
    expect(validateSchema({ oneOf: [{ type: 'object' }, { type: 'null' }] }, {}, '')).toEqual(null);
    expect(
      validateSchema({ oneOf: [{ type: 'number' }, { required: ['a'] }] }, { a: true }, '')
    ).toEqual(null);
    expect(validateSchema({ oneOf: [{ type: 'object' }, { required: ['a'] }] }, { a: true }, ''))
      .toMatchInlineSnapshot(`
      {
        "cause": [],
        "keyword": "oneOf",
        "message": "Value matches 2 schemas, but exactly one is required",
        "path": "",
        "value": {
          "a": true,
        },
      }
    `);
    expect(validateSchema({ oneOf: [{ type: 'object' }, { type: 'number' }] }, null, ''))
      .toMatchInlineSnapshot(`
      {
        "cause": [
          {
            "keyword": "type",
            "message": "Expected type object, got null",
            "path": "",
            "value": undefined,
          },
          {
            "keyword": "type",
            "message": "Expected type number, got null",
            "path": "",
            "value": undefined,
          },
        ],
        "keyword": "oneOf",
        "message": "Value does not match any of the oneOf schemas",
        "path": "",
        "value": null,
      }
    `);
  });
});
