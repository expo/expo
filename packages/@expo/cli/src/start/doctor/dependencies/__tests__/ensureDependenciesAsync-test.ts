import { createInstallCommand } from '../ensureDependenciesAsync';

describe(createInstallCommand, () => {
  it(`formats install`, () => {
    expect(
      createInstallCommand({
        packages: [
          { pkg: 'bacon', file: '', version: '~1.0.0' },
          { pkg: 'other', file: '' },
        ],
      })
    ).toBe('npx expo install bacon@~1.0.0 other');
  });
});
