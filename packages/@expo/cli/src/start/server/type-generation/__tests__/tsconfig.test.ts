import { getTSConfigRemoveUpdates, getTSConfigUpdates } from '../tsconfig';

describe(getTSConfigUpdates, () => {
  it('add to a new tsconfig', () => {
    const { tsConfig, updates } = getTSConfigUpdates({});

    expect(tsConfig.include).toEqual([
      '**/*.ts',
      '**/*.tsx',
      '.expo/types/**/*.ts',
      'expo-env.d.ts',
    ]);
    expect([...updates]).toEqual(['include']);
  });

  it('modify an existing tsconfig', () => {
    const { tsConfig, updates } = getTSConfigUpdates({
      include: ['my-file'],
    });

    expect(tsConfig.include).toEqual(['my-file', '.expo/types/**/*.ts', 'expo-env.d.ts']);
    expect([...updates]).toEqual(['include']);
  });

  it('modify add expo-env to an existing config', () => {
    const { tsConfig, updates } = getTSConfigUpdates({
      include: ['my-file', '.expo/types/**/*.ts'],
    });

    expect(tsConfig.include).toEqual(['my-file', '.expo/types/**/*.ts', 'expo-env.d.ts']);
    expect([...updates]).toEqual(['include']);
  });

  it('does not modify correct tsconfig', () => {
    const { updates } = getTSConfigUpdates({
      include: ['my-file', '.expo/types/**/*.ts', 'expo-env.d.ts'],
    });

    expect([...updates]).toHaveLength(0);
  });
});

describe(getTSConfigRemoveUpdates, () => {
  it('can remove the expo types from include', () => {
    const { tsConfig, updates } = getTSConfigRemoveUpdates({
      include: ['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts', 'expo-env.d.ts'],
    });

    expect(tsConfig.include).toEqual(['**/*.ts', '**/*.tsx']);
    expect([...updates]).toEqual(['include']);
  });

  it('does not modify correct tsconfig', () => {
    const { updates } = getTSConfigRemoveUpdates({
      include: ['my-file'],
      plugins: [{ name: 'my-plugin' }],
    });

    expect([...updates]).toHaveLength(0);
  });
});
