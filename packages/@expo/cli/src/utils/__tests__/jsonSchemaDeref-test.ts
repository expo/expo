// The MIT License (MIT), Copyright (c) 2016 Bojan D.
// See: https://github.com/cvent/json-schema-deref-sync/blob/fa78067/test/index.js
// This is directly derived from the `json-schema-deref-sync` tests.
// NOTE: File refs and loader support have been removed

import { jsonSchemaDeref as deref } from '../jsonSchemaDeref';

const basicSchema = {
  description: 'Just a basic schema.',
  title: 'Basic Object',
  type: 'object',
  properties: {
    id: {
      description: 'unique identifier of a the object',
      type: 'string',
      minLength: 1,
    },
    foo: {
      description: 'foo property',
      readOnly: true,
      type: 'number',
    },
    bar: {
      description: 'bar property',
      type: 'boolean',
    },
  },
};

it('should work with basic schema', () => {
  expect(deref(basicSchema)).toEqual(basicSchema);
});

it('should work with basic local refs', () => {
  const INPUT = {
    ...basicSchema,
    properties: {
      id: {
        $ref: '#/definitions/id',
      },
      foo: {
        $ref: '#/definitions/foo',
      },
      bar: {
        $ref: '#/definitions/bar',
      },
    },
  };

  const EXPECTED = {
    ...basicSchema,
    properties: {
      id: {
        description: 'unique identifier of a the object',
        type: 'string',
        minLength: 1,
      },
      foo: {
        description: 'foo property',
        readOnly: true,
        type: 'number',
      },
      bar: {
        description: 'bar property',
        type: 'boolean',
      },
    },
  };

  expect(deref(INPUT)).toEqual(EXPECTED);
});

// NOTE(@kitten): File ref support has been removed
it('should work with basic file refs and relative baseFolder', () => {
  const INPUT = {
    description: 'Just a basic schema.',
    title: 'Basic Object',
    type: 'object',
    properties: {
      id: {
        $ref: 'id.json',
      },
      foo: {
        $ref: 'foo.json',
      },
      bar: {
        $ref: 'bar.json',
      },
    },
  };

  expect(() => deref(INPUT)).toThrow();
});

// it.todo('should work with basic file refs and absolute + relative baseFolder');
// it.todo('should work with basic file refs and absolute baseFolder');
// it.todo('should work with local and file refs');
// it.todo('should work with absolute files');
// it.todo('should work with absolute files with # at end');
// it.todo('should work with yaml files using custom loader');
// it.todo('should work with simple web refs');
// it.todo('should work with simple web refs ended with #');
// it.todo('should work with web and local mixed refs');
// it.todo('should work with simple web refs ended with # and option');
// it.todo('should work with web refs with json pointers');
// it.todo('should work with file refs with json pointers');

it('should work with nested json pointers', () => {
  const INPUT = {
    $schema: 'http://json-schema.org/draft-04/schema#',
    description: 'Some app',
    type: 'object',
    definitions: {
      app: {
        definitions: {
          domains: {
            items: {
              $ref: '#/definitions/domain',
            },
            type: 'array',
          },
          name: {
            pattern: '^[a-z][a-z0-9-]{3,30}$',
            type: 'string',
          },
        },
        properties: {
          domains: {
            $ref: '#/definitions/app/definitions/domains',
          },
          name: {
            $ref: '#/definitions/app/definitions/name',
          },
        },
        required: ['name'],
        type: 'object',
      },
      domain: {
        definitions: {
          name: {
            format: 'hostname',
            type: 'string',
          },
        },
        properties: {
          name: {
            $ref: '#/definitions/domain/definitions/name',
          },
        },
        required: ['name'],
        type: 'object',
      },
    },
    properties: {
      app: {
        $ref: '#/definitions/app',
      },
      domain: {
        $ref: '#/definitions/domain',
      },
    },
  };

  const EXPECTED = {
    $schema: 'http://json-schema.org/draft-04/schema#',
    description: 'Some app',
    type: 'object',
    definitions: {
      app: {
        definitions: {
          domains: {
            items: {
              definitions: {
                name: {
                  format: 'hostname',
                  type: 'string',
                },
              },
              properties: {
                name: {
                  format: 'hostname',
                  type: 'string',
                },
              },
              required: ['name'],
              type: 'object',
            },
            type: 'array',
          },
          name: {
            pattern: '^[a-z][a-z0-9-]{3,30}$',
            type: 'string',
          },
        },
        properties: {
          domains: {
            items: {
              definitions: {
                name: {
                  format: 'hostname',
                  type: 'string',
                },
              },
              properties: {
                name: {
                  format: 'hostname',
                  type: 'string',
                },
              },
              required: ['name'],
              type: 'object',
            },
            type: 'array',
          },
          name: {
            pattern: '^[a-z][a-z0-9-]{3,30}$',
            type: 'string',
          },
        },
        required: ['name'],
        type: 'object',
      },
      domain: {
        definitions: {
          name: {
            format: 'hostname',
            type: 'string',
          },
        },
        properties: {
          name: {
            format: 'hostname',
            type: 'string',
          },
        },
        required: ['name'],
        type: 'object',
      },
    },
    properties: {
      app: {
        definitions: {
          domains: {
            items: {
              definitions: {
                name: {
                  format: 'hostname',
                  type: 'string',
                },
              },
              properties: {
                name: {
                  format: 'hostname',
                  type: 'string',
                },
              },
              required: ['name'],
              type: 'object',
            },
            type: 'array',
          },
          name: {
            pattern: '^[a-z][a-z0-9-]{3,30}$',
            type: 'string',
          },
        },
        properties: {
          domains: {
            items: {
              definitions: {
                name: {
                  format: 'hostname',
                  type: 'string',
                },
              },
              properties: {
                name: {
                  format: 'hostname',
                  type: 'string',
                },
              },
              required: ['name'],
              type: 'object',
            },
            type: 'array',
          },
          name: {
            pattern: '^[a-z][a-z0-9-]{3,30}$',
            type: 'string',
          },
        },
        required: ['name'],
        type: 'object',
      },
      domain: {
        definitions: {
          name: {
            format: 'hostname',
            type: 'string',
          },
        },
        properties: {
          name: {
            format: 'hostname',
            type: 'string',
          },
        },
        required: ['name'],
        type: 'object',
      },
    },
  };

  expect(deref(INPUT)).toEqual(EXPECTED);
});

// it.todo('should work with nested json pointers to files and links ref to files');
// it.todo('should work with nested json pointers to files and links ref to files via custom loader');
// it.todo('should work with nested json pointers to files with redirect to file in an array');
// it.todo('should work with deep links');
// it.todo('should work with deep nested ref links');
// it.todo('should work with custom types');
// it.todo('should work unknown type 2');

it('should work with missing properties', () => {
  const INPUT = {
    description: 'Just a basic schema.',
    title: 'Basic Object',
    type: 'object',
    definitions: {
      foo: {
        description: 'foo property',
        readOnly: true,
        type: 'number',
      },
      bar: {
        description: 'bar property',
        type: 'boolean',
      },
    },
    properties: {
      foo: {
        $ref: '#/definitions/foo',
      },
      bar: {
        $ref: '#/definitions/bar',
      },
      stuff: {
        $ref: '#/definitions/stuff',
      },
    },
  };

  const EXPECTED = {
    description: 'Just a basic schema.',
    title: 'Basic Object',
    type: 'object',
    definitions: {
      foo: {
        description: 'foo property',
        readOnly: true,
        type: 'number',
      },
      bar: {
        description: 'bar property',
        type: 'boolean',
      },
    },
    properties: {
      foo: {
        description: 'foo property',
        readOnly: true,
        type: 'number',
      },
      bar: {
        description: 'bar property',
        type: 'boolean',
      },
      stuff: {
        $ref: '#/definitions/stuff',
      },
    },
  };

  expect(deref(INPUT)).toEqual(EXPECTED);
});

// it.todo('should error with missing properties if option specified');
it('should work with anyOf array properties', () => {
  const INPUT = {
    $schema: 'http://json-schema.org/draft-04/schema#',
    definitions: {
      localDef1: {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
        },
      },
      localDef2: {
        type: 'object',
        properties: {
          bar: {
            type: 'number',
          },
        },
      },
    },
    anyOf: [
      {
        $ref: '#/definitions/localDef1',
      },
      {
        type: 'object',
        properties: {
          baz: {
            $ref: '#/definitions/localDef2',
          },
        },
      },
    ],
  };

  const EXPECTED = {
    $schema: 'http://json-schema.org/draft-04/schema#',
    definitions: {
      localDef1: {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
        },
      },
      localDef2: {
        type: 'object',
        properties: {
          bar: {
            type: 'number',
          },
        },
      },
    },
    anyOf: [
      {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
        },
      },
      {
        type: 'object',
        properties: {
          baz: {
            type: 'object',
            properties: {
              bar: {
                type: 'number',
              },
            },
          },
        },
      },
    ],
  };

  expect(deref(INPUT)).toEqual(EXPECTED);
});

it('should work with dots (.) in properties', () => {
  const INPUT = {
    $schema: 'http://json-schema.org/draft-04/schema#',
    definitions: {
      def: {
        type: 'string',
      },
    },
    type: 'object',
    patternProperties: {
      '^abc.+$': {
        $ref: '#/definitions/def',
      },
    },
  };

  const EXPECTED = {
    $schema: 'http://json-schema.org/draft-04/schema#',
    definitions: {
      def: {
        type: 'string',
      },
    },
    type: 'object',
    patternProperties: {
      '^abc.+$': {
        type: 'string',
      },
    },
  };

  expect(deref(INPUT)).toEqual(EXPECTED);
});

// it.todo('should work with top level ref properties');

it('should work with local circular ref properties', () => {
  const INPUT = {
    description: 'Just a basic schema.',
    title: 'Basic Object',
    type: 'object',
    definitions: {
      foo: {
        $ref: '#/definitions/bar',
      },
      bar: {
        $ref: '#/definitions/foo',
      },
    },
    properties: {
      foo: {
        $ref: '#/definitions/foo',
      },
      bar: {
        $ref: '#/definitions/bar',
      },
    },
  };

  const EXPECTED = {
    description: 'Just a basic schema.',
    title: 'Basic Object',
    type: 'object',
    definitions: {
      foo: {
        $ref: '#/definitions/foo',
      },
      bar: {
        $ref: '#/definitions/bar',
      },
    },
    properties: {
      foo: {
        $ref: '#/definitions/bar',
      },
      bar: {
        $ref: '#/definitions/foo',
      },
    },
  };

  expect(deref(INPUT)).toEqual(EXPECTED);
});

it('should work with local self referencing properties', () => {
  const INPUT = {
    description: 'Just a basic schema.',
    title: 'Basic Object',
    type: 'object',
    definitions: {
      RegexNodeDto: {
        id: 'RegexNodeDto',
        properties: {
          Children: {
            required: true,
            items: {
              $ref: '#/definitions/RegexNodeDto',
            },
            type: 'Array',
          },
          NodeType: {
            required: true,
            type: 'string',
          },
          Pattern: {
            required: true,
            type: 'string',
          },
          Index: {
            required: true,
            type: 'int',
          },
          Id: {
            required: true,
            type: 'int',
          },
        },
      },
    },
  };

  expect(deref(INPUT)).toEqual(INPUT);
});

// it.todo('should work with circular file ref properties');
// it.todo('should work with array refs in file');

it('should work with cyclical object', () => {
  const INPUT = {
    $schema: 'http://json-schema.org/draft-04/hyper-schema',
    title: 'myApp',
    type: 'object',
    properties: {
      id: {
        format: 'string',
      },
    },
    links: [
      {
        allOf: [
          {
            $ref: 'redaktor.json#/definitions/read/definitions/GET_byId',
          },
          {
            schema: {
              $ref: '#',
            },
          },
        ],
      },
    ],
  };

  expect(() => deref(INPUT)).toThrow();
});

// it.todo('should work with nested folders object');

it('should work with nested schema issue 12', function () {
  const INPUT = {
    swagger: '2.0',
    info: {
      version: '0.0.0',
      title: 'Broken Deferencer',
    },
    paths: {
      '/': {
        get: {
          responses: {
            '200': {
              description: 'OK',
              schema: {
                properties: {
                  sheep: {
                    type: 'array',
                    items: {
                      $ref: '#/definitions/sheep',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    definitions: {
      sheep: {
        properties: {
          color: {
            type: 'string',
          },
          lastSheering: {
            type: 'string',
            format: 'date',
          },
        },
      },
    },
  };

  const EXPECTED = {
    swagger: '2.0',
    info: {
      version: '0.0.0',
      title: 'Broken Deferencer',
    },
    paths: {
      '/': {
        get: {
          responses: {
            '200': {
              description: 'OK',
              schema: {
                properties: {
                  sheep: {
                    type: 'array',
                    items: {
                      properties: {
                        color: {
                          type: 'string',
                        },
                        lastSheering: {
                          type: 'string',
                          format: 'date',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    definitions: {
      sheep: {
        properties: {
          color: {
            type: 'string',
          },
          lastSheering: {
            type: 'string',
            format: 'date',
          },
        },
      },
    },
  };

  expect(deref(INPUT)).toEqual(EXPECTED);
});

it('should work with falsy values in schema', function () {
  const INPUT = {
    title: 'object with falsy values and references',
    isNull: null,
    isFalse: false,
    isZero: 0,
    properties: {
      nullRef: {
        $ref: '#/isNull',
      },
      falseRef: {
        $ref: '#/isFalse',
      },
      zeroRef: {
        $ref: '#/isZero',
      },
      otherTitle: {
        $ref: '#/title',
      },
    },
  };

  const EXPECTED = {
    title: 'object with falsy values and references',
    isNull: null,
    isFalse: false,
    isZero: 0,
    properties: {
      nullRef: null,
      falseRef: false,
      zeroRef: 0,
      otherTitle: 'object with falsy values and references',
    },
  };

  expect(deref(INPUT)).toEqual(EXPECTED);
});

it('should work with null values in default attribute', function () {
  const INPUT = {
    $schema: 'http://json-schema.org/draft-04/schema#',
    id: 'address-1.0.0',
    type: 'object',
    definitions: {
      line_1: {
        anyOf: [
          {
            type: 'string',
          },
          {
            type: 'null',
          },
        ],
        description: 'address line 1',
        'x-example': '11 test Street',
        default: null,
      },
    },
    properties: {
      line_1: {
        $ref: '#/definitions/line_1',
      },
    },
  };

  const EXPECTED = {
    $schema: 'http://json-schema.org/draft-04/schema#',
    id: 'address-1.0.0',
    type: 'object',
    definitions: {
      line_1: {
        anyOf: [
          {
            type: 'string',
          },
          {
            type: 'null',
          },
        ],
        description: 'address line 1',
        'x-example': '11 test Street',
        default: null,
      },
    },
    properties: {
      line_1: {
        anyOf: [
          {
            type: 'string',
          },
          {
            type: 'null',
          },
        ],
        description: 'address line 1',
        'x-example': '11 test Street',
        default: null,
      },
    },
  };

  expect(deref(INPUT)).toEqual(EXPECTED);
});

it('should work with paths of the same name as ref', function () {
  const INPUT = {
    description: 'Just a basic schema.',
    title: 'Basic Object',
    type: 'object',
    properties: {
      description: {
        $ref: '#/description',
      },
    },
  };

  const EXPECTED = {
    description: 'Just a basic schema.',
    title: 'Basic Object',
    type: 'object',
    properties: {
      description: 'Just a basic schema.',
    },
  };

  expect(deref(INPUT)).toEqual(EXPECTED);
});

it('should work with keys containing "."', function () {
  const INPUT = {
    description: 'Just a basic schema.',
    title: 'Basic Object',
    type: 'object',
    definitions: {
      'my.key': {
        description: 'foo property',
        readOnly: true,
        type: 'number',
      },
    },
    properties: {
      mykey: {
        $ref: '#/definitions/my.key',
      },
    },
  };

  const EXPECTED = {
    description: 'Just a basic schema.',
    title: 'Basic Object',
    type: 'object',
    definitions: {
      'my.key': {
        description: 'foo property',
        readOnly: true,
        type: 'number',
      },
    },
    properties: {
      mykey: {
        description: 'foo property',
        readOnly: true,
        type: 'number',
      },
    },
  };

  expect(deref(INPUT)).toEqual(EXPECTED);
});

// it.todo('should not remove IDs from merged properties');
