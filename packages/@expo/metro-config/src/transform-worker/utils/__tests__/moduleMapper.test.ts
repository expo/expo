import path from 'path';

import { createStickyModuleMapper } from '../moduleMapper';

describe(createStickyModuleMapper, () => {
  it('remaps module names given to it', () => {
    const moduleMapper = createStickyModuleMapper(['@expo/metro-config']);

    expect(moduleMapper('@expo/metro-config', '<mock>')).toBe(
      path.dirname(require.resolve('@expo/metro-config/package.json'))
    );
    expect(moduleMapper('@expo/metro-config/build/ExpoMetroConfig.js', '<mock>')).toBe(
      require.resolve('@expo/metro-config/build/ExpoMetroConfig.js')
    );
    // Leaves unrelated modules alone
    expect(moduleMapper('@expo/cli', '<mock>')).toBe(null);
  });

  it('ignores requests from parents within module root paths', () => {
    const moduleMapper = createStickyModuleMapper(['@expo/metro-config']);
    expect(moduleMapper('@expo/metro-config', require.resolve('@expo/metro-config'))).toBe(null);
    expect(moduleMapper('@expo/metro-config', '<mock>')).not.toBe(null);
  });
});
