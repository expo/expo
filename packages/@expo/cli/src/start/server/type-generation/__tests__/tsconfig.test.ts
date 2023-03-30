import { getTSConfigRemoveUpdates, getTSConfigUpdates } from '../tsconfig';

describe(`${getTSConfigUpdates}`, () => {
  it('can add a new include', () => {
    const { tsConfig, updates } = getTSConfigUpdates({});

    expect(tsConfig.include).toEqual(['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts']);
    expect([...updates]).toEqual(['include']);
  });

  it('modify an existing include', () => {
    const { tsConfig, updates } = getTSConfigUpdates({ include: ['my-file'] });

    expect(tsConfig.include).toEqual(['my-file', '.expo/types/**/*.ts']);
    expect([...updates]).toEqual(['include']);
  });
});

describe(`${getTSConfigRemoveUpdates}`, () => {
  it('can add a new include', () => {
    const { tsConfig, updates } = getTSConfigRemoveUpdates({
      include: ['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts'],
    });

    expect(tsConfig.include).toEqual(['**/*.ts', '**/*.tsx']);
    expect([...updates]).toEqual(['include']);
  });
});
