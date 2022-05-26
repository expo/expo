import { createInstallCommand } from '../ensureDependenciesAsync';

describe(createInstallCommand, () => {
  it(`formats yarn`, () => {
    expect(
      createInstallCommand({
        manager: 'yarn',
        packages: [
          { pkg: 'bacon', file: '', version: '~1.0.0' },
          { pkg: 'other', file: '' },
        ],
      })
    ).toBe('yarn add bacon@~1.0.0 other');
  });
  it(`formats npm`, () => {
    expect(
      createInstallCommand({
        manager: 'npm',
        packages: [
          { pkg: '@other/pkg', file: '' },
          { pkg: 'bacon', file: '', version: '~1.0.0' },
        ],
      })
    ).toBe('npm install @other/pkg bacon@~1.0.0');
  });
  it(`formats pnpm`, () => {
    expect(
      createInstallCommand({
        manager: 'pnpm',
        packages: [
          { pkg: '@other/pkg', file: '' },
          { pkg: 'bacon', file: '', version: '~1.0.0' },
        ],
      })
    ).toBe('pnpm install @other/pkg bacon@~1.0.0');
  });
});
