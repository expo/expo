import path from 'path';

import { createStickyModuleMapper } from '../moduleMapper';

describe(createStickyModuleMapper, () => {
  it('remaps module names given to it', () => {
    const moduleMapper = createStickyModuleMapper();

    expect(moduleMapper('@expo/metro-config', '<mock>')).toBe(
      require.resolve('@expo/metro-config')
    );
    expect(moduleMapper('metro', '<mock>')).toBe(require.resolve('metro'));
    // Leaves unrelated modules alone
    expect(moduleMapper('@expo/cli', '<mock>')).toBe(null);
  });

  it('ignores requests from parents within module root paths', () => {
    const moduleMapper = createStickyModuleMapper();
    expect(moduleMapper('@expo/metro-config', '<mock>')).not.toBe(null);
  });
});
