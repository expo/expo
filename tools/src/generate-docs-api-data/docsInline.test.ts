/**
 * Tests for the pure helpers behind `applyDocsInline`.
 *
 * Each suite documents one phase of the pipeline by example. Discovery from
 * the filesystem (`findTaggedTypes`) and the side TypeDoc pass
 * (`collectTaggedDeclarations`) are not unit-tested here — they're
 * end-to-end-tested via `et gdad` regenerating the expo-ui JSON.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  findTaggedNamesInSource,
  inlineInheritedMembers,
  removeTaggedFromTopLevel,
  substituteTypeReferences,
  suppressLeftoverReferences,
} from './docsInline';

describe('findTaggedNamesInSource', () => {
  it('finds an interface declaration tagged with @docsInline', () => {
    const src = `
      /**
       * Base props.
       * @docsInline
       */
      export interface BaseProps {
        disabled?: boolean;
      }
    `;
    assert.deepEqual(findTaggedNamesInSource(src), ['BaseProps']);
  });

  it('finds a type alias declaration tagged with @docsInline', () => {
    const src = `
      /**
       * @docsInline
       */
      export type Alignment = 'start' | 'center' | 'end';
    `;
    assert.deepEqual(findTaggedNamesInSource(src), ['Alignment']);
  });

  it('finds multiple tagged declarations in one file', () => {
    const src = `
      /** @docsInline */
      export interface A { a?: number }

      /** unrelated */
      export interface B { b?: number }

      /** @docsInline */
      export type C = 'x' | 'y';
    `;
    assert.deepEqual(findTaggedNamesInSource(src).sort(), ['A', 'C']);
  });

  it('returns an empty array when no declarations are tagged', () => {
    const src = `
      // @docsInline appearing in a line comment is not a JSDoc tag.
      export interface NotTagged { a?: number }
    `;
    assert.deepEqual(findTaggedNamesInSource(src), []);
  });

  it('ignores @docsInline on non-interface/type declarations', () => {
    const src = `
      /** @docsInline */
      export const value = 1;

      /** @docsInline */
      export function helper() {}
    `;
    assert.deepEqual(findTaggedNamesInSource(src), []);
  });
});

describe('inlineInheritedMembers', () => {
  it('strips inheritedFrom markers and the matching extendedTypes entry', () => {
    const json = {
      name: 'ColumnProps',
      kind: 256,
      extendedTypes: [{ type: 'reference', name: 'BaseProps' }],
      children: [
        { name: 'spacing', kind: 1024 }, // local
        {
          name: 'disabled',
          kind: 1024,
          inheritedFrom: { type: 'reference', name: 'BaseProps.disabled' },
        },
        {
          name: 'testID',
          kind: 1024,
          inheritedFrom: { type: 'reference', name: 'BaseProps.testID' },
        },
      ],
    };

    inlineInheritedMembers(json, new Set(['BaseProps']));

    assert.equal(json.extendedTypes, undefined);
    for (const child of json.children) {
      assert.equal((child as any).inheritedFrom, undefined);
    }
  });

  it('leaves untagged inheritance untouched', () => {
    const json = {
      name: 'ColumnProps',
      kind: 256,
      extendedTypes: [{ type: 'reference', name: 'OtherBase' }],
      children: [{ name: 'a', inheritedFrom: { type: 'reference', name: 'OtherBase.a' } }],
    };
    const before = JSON.stringify(json);
    inlineInheritedMembers(json, new Set(['BaseProps']));
    assert.equal(JSON.stringify(json), before);
  });

  it('keeps non-tagged extendedTypes when stripping a tagged one alongside', () => {
    const json = {
      name: 'X',
      extendedTypes: [
        { type: 'reference', name: 'BaseProps' },
        { type: 'reference', name: 'OtherBase' },
      ],
      children: [],
    };
    inlineInheritedMembers(json, new Set(['BaseProps']));
    assert.deepEqual(json.extendedTypes, [{ type: 'reference', name: 'OtherBase' }]);
  });

  it('is a no-op when taggedTypes is empty', () => {
    const json = {
      extendedTypes: [{ type: 'reference', name: 'BaseProps' }],
      children: [{ name: 'a', inheritedFrom: { type: 'reference', name: 'BaseProps.a' } }],
    };
    const before = JSON.stringify(json);
    inlineInheritedMembers(json, new Set());
    assert.equal(JSON.stringify(json), before);
  });
});

describe('substituteTypeReferences', () => {
  it('inlines a type alias reference with its resolved union', () => {
    const decl = {
      name: 'Alignment',
      kind: 2097152, // TypeAlias
      type: {
        type: 'union',
        types: [
          { type: 'literal', value: 'start' },
          { type: 'literal', value: 'end' },
        ],
      },
    };
    const declMap = new Map<string, any>([['Alignment', decl]]);

    const json = {
      name: 'alignment',
      type: { type: 'reference', name: 'Alignment' },
    };

    substituteTypeReferences(json, declMap);

    assert.deepEqual(json.type, decl.type);
    // Substitution clones — mutating the substituted node must not affect the source decl.
    (json.type as any).types.push({ type: 'literal', value: 'middle' });
    assert.equal(decl.type.types.length, 2);
  });

  it('synthesizes a TypeLiteral reflection when the tagged type is an interface', () => {
    const decl = {
      name: 'TextStyle',
      kind: 256, // Interface — has children, no top-level `type`
      children: [{ name: 'color', kind: 1024, type: { type: 'intrinsic', name: 'string' } }],
    };
    const declMap = new Map<string, any>([['TextStyle', decl]]);

    const json = {
      name: 'textStyle',
      type: { type: 'reference', name: 'TextStyle' },
    };

    substituteTypeReferences(json, declMap);

    assert.equal((json.type as any).type, 'reflection');
    assert.equal((json.type as any).declaration.kind, 65536); // ReflectionKind.TypeLiteral
    assert.deepEqual((json.type as any).declaration.children, decl.children);
  });

  it('resolves transitive references inside substituted subtrees', () => {
    // Outer interface references Weight; Weight is itself tagged.
    const weightDecl = {
      name: 'Weight',
      kind: 2097152,
      type: {
        type: 'union',
        types: [
          { type: 'literal', value: 'normal' },
          { type: 'literal', value: 'bold' },
        ],
      },
    };
    const styleDecl = {
      name: 'Style',
      kind: 256,
      children: [{ name: 'weight', kind: 1024, type: { type: 'reference', name: 'Weight' } }],
    };
    const declMap = new Map<string, any>([
      ['Style', styleDecl],
      ['Weight', weightDecl],
    ]);

    const json = {
      type: { type: 'reference', name: 'Style' },
    };

    substituteTypeReferences(json, declMap);

    const weightProp = (json.type as any).declaration.children[0];
    assert.equal(weightProp.type.type, 'union');
    assert.deepEqual(weightProp.type.types, weightDecl.type.types);
  });

  it('leaves references with no matching declaration alone', () => {
    const json = {
      type: { type: 'reference', name: 'Unknown' },
    };
    const before = JSON.stringify(json);
    substituteTypeReferences(json, new Map());
    assert.equal(JSON.stringify(json), before);
  });
});

describe('suppressLeftoverReferences', () => {
  it('rewrites a tagged reference to intrinsic in place', () => {
    const json = {
      name: 'alignment',
      type: {
        type: 'reference',
        name: 'Alignment',
        package: '@expo/ui',
        target: { qualifiedName: 'Alignment' },
      },
    };

    suppressLeftoverReferences(json, new Set(['Alignment']));

    assert.deepEqual(json.type, { type: 'intrinsic', name: 'Alignment' });
  });

  it('leaves untagged references untouched', () => {
    const json = {
      type: { type: 'reference', name: 'OtherType' },
    };
    const before = JSON.stringify(json);
    suppressLeftoverReferences(json, new Set(['Alignment']));
    assert.equal(JSON.stringify(json), before);
  });

  it('walks deeply into nested structures', () => {
    const json = {
      a: { b: [{ c: { type: 'reference', name: 'Tagged' } }] },
    };
    suppressLeftoverReferences(json, new Set(['Tagged']));
    assert.equal((json as any).a.b[0].c.type, 'intrinsic');
  });
});

describe('removeTaggedFromTopLevel', () => {
  it('drops top-level entries whose name is tagged', () => {
    const json = {
      children: [
        { name: 'Component' },
        { name: 'BaseProps' }, // tagged
        { name: 'Helpers' },
      ],
    };

    removeTaggedFromTopLevel(json, new Set(['BaseProps']));

    assert.deepEqual(
      json.children.map((c) => c.name),
      ['Component', 'Helpers']
    );
  });

  it('does nothing when children is missing or not an array', () => {
    const a: any = {};
    removeTaggedFromTopLevel(a, new Set(['BaseProps']));
    assert.deepEqual(a, {});

    const b: any = { children: 'not an array' };
    removeTaggedFromTopLevel(b, new Set(['BaseProps']));
    assert.equal(b.children, 'not an array');
  });
});
