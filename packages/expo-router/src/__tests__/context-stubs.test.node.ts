import path from 'path';

import LayoutFixture from './fixtures/context-stubs/_layout';
import IndexFixture from './fixtures/context-stubs/index';
import NestedRouteFixture from './fixtures/context-stubs/nested/route';
import { normalizeKeys, requireContextWithOverrides } from '../testing-library/context-stubs';

const appDir = path.join(__dirname, 'fixtures', 'context-stubs');

function MockLayout() {
  return null;
}

describe('normalizeKeys', () => {
  it('maps require-context keys to extension-free, prefix-free keys', () => {
    expect(normalizeKeys(['./_layout.tsx', './index.tsx', './nested/route.tsx'])).toEqual(
      new Map([
        ['_layout', './_layout.tsx'],
        ['index', './index.tsx'],
        ['nested/route', './nested/route.tsx'],
      ])
    );
  });

  it('leaves keys without a valid extension untouched', () => {
    expect(normalizeKeys(['./modal'])).toEqual(new Map([['modal', './modal']]));
  });

  it('throws when multiple files resolve to the same normalized key', () => {
    expect(() => normalizeKeys(['./index.jsx', './index.tsx'])).toThrow(
      'Multiple files resolve to the same route "index": "./index.jsx" and "./index.tsx".'
    );
  });
});

describe('requireContextWithOverrides', () => {
  it('resolves an override registered with an extension-free key to the require-context id', () => {
    const ctx = requireContextWithOverrides(appDir, { _layout: MockLayout });

    expect(ctx('./_layout.tsx').default).toBe(MockLayout);
  });

  it('overrides the default export for an existing file', () => {
    function MockIndex() {
      return null;
    }
    const ctx = requireContextWithOverrides(appDir, { index: MockIndex });

    expect(ctx('./index.tsx').default).toBe(MockIndex);
  });

  it('falls back to the existing context for files without an override', () => {
    const ctx = requireContextWithOverrides(appDir, { _layout: MockLayout });

    expect(ctx('./index.tsx').default).toBe(IndexFixture);
  });

  it('uses the existing context for every file when there are no overrides', () => {
    const ctx = requireContextWithOverrides(appDir, {});

    expect(ctx('./_layout.tsx').default).toBe(LayoutFixture);
    expect(ctx('./index.tsx').default).toBe(IndexFixture);
    expect(ctx('./nested/route.tsx').default).toBe(NestedRouteFixture);
  });

  it('falls back to the existing context for a nested file without an override', () => {
    const ctx = requireContextWithOverrides(appDir, { _layout: MockLayout });

    expect(ctx('./nested/route.tsx').default).toBe(NestedRouteFixture);
  });

  it('overrides a nested file registered with an extension-free key', () => {
    function MockNestedRoute() {
      return null;
    }
    const ctx = requireContextWithOverrides(appDir, { 'nested/route': MockNestedRoute });

    expect(ctx('./nested/route.tsx').default).toBe(MockNestedRoute);
  });

  it('does not list both the override key and the require-context id for the same file', () => {
    const ctx = requireContextWithOverrides(appDir, { _layout: MockLayout });

    const keys = ctx.keys();
    expect(keys).toContain('./_layout.tsx');
    expect(keys).not.toContain('_layout');
    expect(keys.filter((key) => key.replace(/^\.\//, '').startsWith('_layout'))).toEqual([
      './_layout.tsx',
    ]);
  });

  it('keeps overrides that do not match an existing file under a normalized key', () => {
    function MockModal() {
      return null;
    }
    const ctx = requireContextWithOverrides(appDir, { modal: MockModal });

    expect(ctx('./modal').default).toBe(MockModal);
    expect(ctx.keys()).toContain('./modal');
  });
});
