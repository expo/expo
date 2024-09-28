import { vol } from 'memfs';

import { anyMatchAsync, everyMatchAsync } from '../glob';

describe(everyMatchAsync, () => {
  beforeEach(() => {
    vol.reset();
  });

  it('returns all matches for a glob pattern', async () => {
    vol.fromJSON(
      {
        'package.json': '',
        'src/index.ts': '',
        'src/components/index.ts': '',
      },
      '/project'
    );

    await expect(everyMatchAsync('**/*.ts', { cwd: '/project' })).resolves.toEqual([
      'src/index.ts',
      'src/components/index.ts',
    ]);
  });

  it('returns empty array for no matches', async () => {
    await expect(everyMatchAsync('**/*.ts', { cwd: '/project' })).resolves.toEqual([]);
  });
});

describe(anyMatchAsync, () => {
  beforeEach(() => {
    vol.reset();
  });

  it('returns the first match for a glob pattern', async () => {
    vol.fromJSON(
      {
        'src/index.ts': '',
        'src/components/index.ts': '',
        'package.json': '',
      },
      '/project'
    );

    await expect(anyMatchAsync('**/*.ts', { cwd: '/project' })).resolves.toEqual(['src/index.ts']);
  });

  it('returns empty array for no matches', async () => {
    await expect(anyMatchAsync('**/*.ts', { cwd: '/project' })).resolves.toEqual([]);
  });
});
