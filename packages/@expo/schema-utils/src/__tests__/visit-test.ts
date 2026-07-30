import { visit } from '..';
import { JSONSchema } from '../JSONSchema';
import { visitNode } from '../visit';

const collect = (schema: JSONSchema, value: unknown = undefined, walk = visitNode): string[] => {
  const paths: string[] = [];
  walk(schema, value, (_schema, _value, path) => paths.push(path));
  return paths;
};

describe('visitNode', () => {
  it('visits the root with an empty path', () => {
    expect(collect({ type: 'object' })).toEqual(['']);
  });

  it('passes the visited subschema to the visitor', () => {
    const icon: JSONSchema = { type: 'string' };
    const visited: JSONSchema[] = [];
    visitNode({ properties: { icon } }, undefined, (schema) => visited.push(schema));
    expect(visited).toContain(icon);
  });

  it('descends `properties` by name', () => {
    const schema: JSONSchema = {
      properties: {
        icon: { type: 'string' },
        android: { properties: { icon: { type: 'string' } } },
      },
    };
    expect(collect(schema)).toEqual(['', '.icon', '.android', '.android.icon']);
  });

  it('descends tuple `items` by index', () => {
    const schema: JSONSchema = { items: [{ type: 'string' }, { type: 'number' }] };
    expect(collect(schema)).toEqual(['', '[0]', '[1]']);
  });

  it('passes through combinators without extending the path', () => {
    const schema: JSONSchema = {
      allOf: [{ properties: { icon: { type: 'string' } } }],
      anyOf: [{ properties: { splash: { type: 'string' } } }],
    };
    expect(collect(schema)).toEqual(['', '', '.icon', '', '.splash']);
  });

  it('does not descend definitions or follow `$ref`s', () => {
    const schema = {
      properties: { ref: { $ref: '#/definitions/Foo' } },
      definitions: { Foo: { properties: { icon: { type: 'string' } } } },
    } as unknown as JSONSchema;
    expect(collect(schema)).toEqual(['', '.ref']);
  });

  it('threads the value found at each path', () => {
    const schema: JSONSchema = {
      properties: { android: { properties: { icon: { type: 'string' } } } },
    };
    const seen: [string, unknown][] = [];
    visitNode(schema, { android: { icon: './icon.png' } }, (_schema, value, path) =>
      seen.push([path, value])
    );
    expect(seen).toEqual([
      ['', { android: { icon: './icon.png' } }],
      ['.android', { icon: './icon.png' }],
      ['.android.icon', './icon.png'],
    ]);
  });

  it('visits each element of a single `items` schema', () => {
    expect(collect({ items: { type: 'string' } }, ['a', 'b', 'c'])).toEqual([
      '',
      '[0]',
      '[1]',
      '[2]',
    ]);
  });

  it('visits each `additionalProperties` value key, excluding declared properties', () => {
    const schema: JSONSchema = {
      properties: { name: { type: 'string' } },
      additionalProperties: { type: 'string' },
    };
    expect(collect(schema, { name: 'x', a: '1', b: '2' })).toEqual(['', '.name', '.a', '.b']);
  });

  it('visits each `patternProperties` match', () => {
    const schema: JSONSchema = { patternProperties: { '^x-': { type: 'string' } } };
    expect(collect(schema, { 'x-a': '1', y: '2', 'x-b': '3' })).toEqual(['', '.x-a', '.x-b']);
  });

  it('visits a schema-form `dependencies` entry on the same node when its key is present', () => {
    const schema: JSONSchema = {
      properties: { creditCard: { type: 'number' } },
      dependencies: { creditCard: { properties: { billingAddress: { type: 'string' } } } },
    };
    expect(collect(schema, { creditCard: 1234, billingAddress: 'x' })).toEqual([
      '',
      '.creditCard',
      '',
      '.billingAddress',
    ]);
    // The dependency is not entered when its trigger key is absent.
    expect(collect(schema, { billingAddress: 'x' })).toEqual(['', '.creditCard']);
  });

  it('skips value-driven keywords when no value is present', () => {
    const schema: JSONSchema = {
      additionalProperties: { type: 'string' },
      patternProperties: { '^x-': { type: 'string' } },
      items: { type: 'string' },
    };
    expect(collect(schema)).toEqual(['']);
  });
});

describe('visit', () => {
  it('dereferences `$ref`s and visits the referenced path once', () => {
    const schema = {
      properties: { android: { $ref: '#/definitions/Android' } },
      definitions: { Android: { properties: { icon: { type: 'string' } } } },
    } as unknown as JSONSchema;
    expect(collect(schema, undefined, visit)).toEqual(['', '.android', '.android.icon']);
  });
});
