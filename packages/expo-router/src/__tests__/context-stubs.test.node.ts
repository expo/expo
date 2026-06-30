import path from 'path';

import { requireContextWithOverrides } from '../testing-library/context-stubs';

const appDir = path.join(__dirname, 'fixtures', 'context-stubs');

function MockLayout() {
  return null;
}

describe('requireContextWithOverrides', () => {
  it('resolves an override registered with an extension-free key to the require-context id', () => {
    const ctx = requireContextWithOverrides(appDir, { _layout: MockLayout });

    expect(ctx('./_layout.tsx').default).toBe(MockLayout);
  });

  it('falls back to the existing context for files without an override', () => {
    const ctx = requireContextWithOverrides(appDir, { _layout: MockLayout });

    expect(ctx('./index.tsx').default.name).toBe('Index');
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
