import path from 'path';

import {
  findDuplicateKeys,
  normalizeKey,
  normalizeKeys,
  requireContextWithOverrides,
} from '../testing-library/context-stubs';
import LayoutFixture from './fixtures/context-stubs/_layout';
import IndexFixture from './fixtures/context-stubs/index';
import NestedRouteFixture from './fixtures/context-stubs/nested/route';

const appDir = path.join(__dirname, 'fixtures', 'context-stubs');

function MockLayout() {
  return null;
}

describe('normalizeKey', () => {
  it('strips the leading `./` and a valid extension', () => {
    expect(normalizeKey('./_layout.tsx')).toBe('_layout');
    expect(normalizeKey('./index.jsx')).toBe('index');
    expect(normalizeKey('./nested/route.ts')).toBe('nested/route');
    expect(normalizeKey('./index.js')).toBe('index');
  });

  it('leaves keys without a valid extension untouched', () => {
    expect(normalizeKey('./modal')).toBe('modal');
    expect(normalizeKey('modal')).toBe('modal');
  });

  it('only strips the final extension segment', () => {
    expect(normalizeKey('./index.web.tsx')).toBe('index.web');
  });
});

describe('findDuplicateKeys', () => {
  it('returns an empty array when all keys are unique', () => {
    expect(findDuplicateKeys(['_layout', 'index', 'nested/route'])).toEqual([]);
  });

  it('returns the duplicated keys', () => {
    expect(findDuplicateKeys(['index', 'index', '_layout'])).toEqual(['index']);
  });
});

describe('normalizeKeys', () => {
  it('maps require-context keys to extension-free, prefix-free keys', () => {
    expect(normalizeKeys(['./_layout.tsx', './index.tsx', './nested/route.tsx'])).toEqual({
      _layout: './_layout.tsx',
      index: './index.tsx',
      'nested/route': './nested/route.tsx',
    });
  });

  it('leaves keys without a valid extension untouched', () => {
    expect(normalizeKeys(['./modal'])).toEqual({ modal: './modal' });
  });

  it('throws when multiple files resolve to the same normalized key', () => {
    expect(() => normalizeKeys(['./index.jsx', './index.tsx'])).toThrow(
      'Multiple routes resolved to the same route: index'
    );
  });
});

describe('requireContextWithOverrides', () => {
  it('resolves an override registered with an extension-free key', () => {
    const ctx = requireContextWithOverrides(appDir, { _layout: MockLayout });

    expect(ctx('_layout').default).toBe(MockLayout);
  });

  it('overrides the default export for an existing file', () => {
    function MockIndex() {
      return null;
    }
    const ctx = requireContextWithOverrides(appDir, { index: MockIndex });

    expect(ctx('index').default).toBe(MockIndex);
  });

  it('falls back to the existing context for files without an override', () => {
    const ctx = requireContextWithOverrides(appDir, { _layout: MockLayout });

    expect(ctx('index').default).toBe(IndexFixture);
  });

  it('uses the existing context for every file when there are no overrides', () => {
    const ctx = requireContextWithOverrides(appDir, {});

    expect(ctx('_layout').default).toBe(LayoutFixture);
    expect(ctx('index').default).toBe(IndexFixture);
    expect(ctx('nested/route').default).toBe(NestedRouteFixture);
  });

  it('falls back to the existing context for a nested file without an override', () => {
    const ctx = requireContextWithOverrides(appDir, { _layout: MockLayout });

    expect(ctx('nested/route').default).toBe(NestedRouteFixture);
  });

  it('overrides a nested file registered with an extension-free key', () => {
    function MockNestedRoute() {
      return null;
    }
    const ctx = requireContextWithOverrides(appDir, { 'nested/route': MockNestedRoute });

    expect(ctx('nested/route').default).toBe(MockNestedRoute);
  });

  it('lists normalized keys and does not duplicate an overridden file', () => {
    const ctx = requireContextWithOverrides(appDir, { _layout: MockLayout });

    const keys = ctx.keys();
    expect(keys).not.toContain('./_layout.tsx');
    expect(keys.filter((key) => key === '_layout')).toEqual(['_layout']);
    expect(keys).toEqual(expect.arrayContaining(['_layout', 'index', 'nested/route']));
  });

  it('keeps overrides that do not match an existing file', () => {
    function MockModal() {
      return null;
    }
    const ctx = requireContextWithOverrides(appDir, { modal: MockModal });

    expect(ctx('modal').default).toBe(MockModal);
    expect(ctx.keys()).toContain('modal');
  });
});
