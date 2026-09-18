import type { TypeNode } from '@expo/expo-modules-macros-plugin';

import { renderType, type RenderContext } from '../renderType';

const Bool: TypeNode = { kind: 'primitive', name: 'Bool', typeof: 'boolean' };
const Int: TypeNode = { kind: 'primitive', name: 'Int', typeof: 'number' };
const Double: TypeNode = { kind: 'primitive', name: 'Double', typeof: 'number' };
const Str: TypeNode = { kind: 'primitive', name: 'String', typeof: 'string' };

function makeContext(refs: Record<string, string> = {}) {
  const warnings: string[] = [];
  const ctx: RenderContext = {
    resolveRef: (name) => refs[name],
    warn: (message) => {
      warnings.push(message);
    },
  };
  return { ctx, warnings };
}

describe(renderType, () => {
  it('maps primitives to their JS typeof', () => {
    const { ctx, warnings } = makeContext();
    expect(renderType(Bool, ctx)).toBe('boolean');
    expect(renderType(Int, ctx)).toBe('number');
    expect(renderType(Double, ctx)).toBe('number');
    expect(renderType(Str, ctx)).toBe('string');
    expect(warnings).toEqual([]);
  });

  it('renders a primitive with a typeof that has no TypeScript type as unknown and warns', () => {
    const { ctx, warnings } = makeContext();
    expect(renderType({ kind: 'primitive', name: 'Closure', typeof: 'function' }, ctx)).toBe(
      'unknown'
    );
    expect(warnings).toEqual([
      "primitive 'Closure' reported as typeof 'function' has no TypeScript type, rendered as unknown",
    ]);
  });

  it('renders optionals as a null union', () => {
    const { ctx } = makeContext();
    expect(renderType({ kind: 'optional', typeof: 'object', wrapped: Str }, ctx)).toBe(
      'string | null'
    );
  });

  it('renders arrays and parenthesizes union elements', () => {
    const { ctx } = makeContext();
    expect(renderType({ kind: 'array', typeof: 'object', element: Int }, ctx)).toBe('number[]');
    expect(
      renderType(
        {
          kind: 'array',
          typeof: 'object',
          element: { kind: 'optional', typeof: 'object', wrapped: Str },
        },
        ctx
      )
    ).toBe('(string | null)[]');
  });

  it('renders dictionaries as Record', () => {
    const { ctx } = makeContext();
    expect(renderType({ kind: 'dictionary', typeof: 'object', key: Str, value: Int }, ctx)).toBe(
      'Record<string, number>'
    );
  });

  it('renders promises', () => {
    const { ctx } = makeContext();
    expect(renderType({ kind: 'promise', typeof: 'object', value: Int }, ctx)).toBe(
      'Promise<number>'
    );
  });

  it('renders closures with positional argument names', () => {
    const { ctx } = makeContext();
    expect(
      renderType(
        {
          kind: 'function',
          typeof: 'function',
          parameters: [Int, Str],
          returns: Bool,
          async: false,
          throws: false,
        },
        ctx
      )
    ).toBe('(arg0: number, arg1: string) => boolean');
    expect(
      renderType(
        { kind: 'function', typeof: 'function', parameters: [Double], async: false, throws: false },
        ctx
      )
    ).toBe('(arg0: number) => void');
  });

  it('wraps an async closure result in a promise', () => {
    const { ctx } = makeContext();
    expect(
      renderType(
        {
          kind: 'function',
          typeof: 'function',
          parameters: [],
          returns: Int,
          async: true,
          throws: true,
        },
        ctx
      )
    ).toBe('() => Promise<number>');
    expect(
      renderType(
        { kind: 'function', typeof: 'function', parameters: [], async: true, throws: false },
        ctx
      )
    ).toBe('() => Promise<void>');
  });

  it('resolves refs to scanned types under their JS name', () => {
    const { ctx, warnings } = makeContext({ VideoPlayer: 'Player' });
    expect(renderType({ kind: 'ref', typeof: 'object', name: 'VideoPlayer' }, ctx)).toBe('Player');
    expect(warnings).toEqual([]);
  });

  it('renders an unresolved ref as unknown and warns', () => {
    const { ctx, warnings } = makeContext();
    expect(renderType({ kind: 'ref', typeof: 'object', name: 'PlaybackStatus' }, ctx)).toBe(
      'unknown'
    );
    expect(warnings).toEqual(["unresolved type 'PlaybackStatus' rendered as unknown"]);
  });

  it('renders an unmodeled type as unknown and warns', () => {
    const { ctx, warnings } = makeContext();
    expect(renderType({ kind: 'unknown', text: '(Int, Int)' }, ctx)).toBe('unknown');
    expect(warnings).toEqual(["unmodeled Swift type '(Int, Int)' rendered as unknown"]);
  });
});
