import { getTSConfigRemoveUpdates, getTSConfigUpdates } from '../tsconfig';

describe(`${getTSConfigUpdates}`, () => {
  it('add to a new tsconfig', () => {
    const { tsConfig, updates } = getTSConfigUpdates({});

    expect(tsConfig.include).toEqual(['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts']);
    expect(tsConfig.plugins).toEqual([{ name: '@expo/typescript-plugin' }]);
    expect([...updates]).toEqual(['include', 'plugins']);
  });

  it('modify an existing tsconfig', () => {
    const { tsConfig, updates } = getTSConfigUpdates({
      include: ['my-file'],
      plugins: [{ name: 'my-plugin' }],
    });

    expect(tsConfig.include).toEqual(['my-file', '.expo/types/**/*.ts']);
    expect(tsConfig.plugins).toEqual([{ name: 'my-plugin' }, { name: '@expo/typescript-plugin' }]);
    expect([...updates]).toEqual(['include', 'plugins']);
  });

  it('does not modify correct tsconfig', () => {
    const { updates } = getTSConfigUpdates({
      include: ['my-file', '.expo/types/**/*.ts'],
      plugins: [{ name: 'my-plugin' }, { name: '@expo/typescript-plugin' }],
    });

    expect([...updates]).toHaveLength(0);
  });
});

describe(`${getTSConfigRemoveUpdates}`, () => {
  it('can remove the expo types from include', () => {
    const { tsConfig, updates } = getTSConfigRemoveUpdates({
      include: ['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts'],
    });

    expect(tsConfig.include).toEqual(['**/*.ts', '**/*.tsx']);
    expect([...updates]).toEqual(['include']);
  });

  it('can remove the expo plugin from plugins', () => {
    const { tsConfig, updates } = getTSConfigRemoveUpdates({
      plugins: [{ name: 'my-plugin' }, { name: '@expo/typescript-plugin' }],
    });

    expect(tsConfig.plugins).toEqual([{ name: 'my-plugin' }]);
    expect([...updates]).toEqual(['plugins']);
  });

  it('does not modify correct tsconfig', () => {
    const { updates } = getTSConfigRemoveUpdates({
      include: ['my-file'],
      plugins: [{ name: 'my-plugin' }],
    });

    expect([...updates]).toHaveLength(0);
  });
});
