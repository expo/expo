import { NODE_STDLIB_MODULES, isNodeExternal } from '../externals';

describe('NODE_STDLIB_MODULES', () => {
  it(`works`, () => {
    expect(NODE_STDLIB_MODULES.length).toBeGreaterThan(5);
    expect(NODE_STDLIB_MODULES.includes('path')).toBe(true);
  });
});

describe(isNodeExternal, () => {
  it('should return the correct module id', () => {
    expect(isNodeExternal('node:fs')).toBe('fs');
    expect(isNodeExternal('fs')).toBe('fs');
  });

  it('should return null for non-node modules', () => {
    expect(isNodeExternal('expo')).toBe(null);
    expect(isNodeExternal('expo:fs')).toBe(null);
  });
});
