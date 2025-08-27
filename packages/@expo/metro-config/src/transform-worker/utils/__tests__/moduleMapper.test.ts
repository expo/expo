import { createModuleMapper } from '../moduleMapper';

describe(createModuleMapper, () => {
  it('remaps module names given to it', () => {
    const moduleMapper = createModuleMapper();

    expect(moduleMapper('@expo/metro-config')).toBe(require.resolve('@expo/metro-config'));
    expect(moduleMapper('metro')).toBe(require.resolve('metro'));
    // Leaves unrelated modules alone
    expect(moduleMapper('@expo/cli')).toBe(null);
  });

  it('ignores unrelated requests', () => {
    const moduleMapper = createModuleMapper();
    expect(moduleMapper('expo-video')).toBe(null);
    expect(moduleMapper('./my-file')).toBe(null);
  });
});
