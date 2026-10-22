import { vol } from 'memfs';

import { resolveLinkedDependencyPathsAsync } from '../LinkedDependencies';

jest.mock('fs');
jest.mock('fs/promises');

describe(resolveLinkedDependencyPathsAsync, () => {
  const projectRoot = '/repo/apps/app';

  afterEach(() => {
    vol.reset();
  });

  it('should return the project-relative real path of a dependency that links outside node_modules', async () => {
    vol.fromJSON({
      '/repo/apps/app/package.json': JSON.stringify({
        dependencies: { 'my-plugin': 'workspace:*', expo: '^54.0.0', plain: '1.0.0' },
        devDependencies: { 'my-dev-plugin': 'workspace:*' },
      }),
      '/repo/packages/my-plugin/package.json': '{}',
      '/repo/packages/my-dev-plugin/package.json': '{}',
      '/repo/node_modules/.pnpm/expo@54.0.0/node_modules/expo/package.json': '{}',
      '/repo/apps/app/node_modules/plain/package.json': '{}',
    });
    vol.symlinkSync('/repo/packages/my-plugin', '/repo/apps/app/node_modules/my-plugin');
    vol.symlinkSync(
      '/repo/node_modules/.pnpm/expo@54.0.0/node_modules/expo',
      '/repo/apps/app/node_modules/expo'
    );
    vol.mkdirSync('/repo/node_modules', { recursive: true });
    vol.symlinkSync('/repo/packages/my-dev-plugin', '/repo/node_modules/my-dev-plugin');

    expect(await resolveLinkedDependencyPathsAsync(projectRoot)).toEqual([
      '../../packages/my-dev-plugin',
      '../../packages/my-plugin',
    ]);
  });

  it('should return an empty list when the project has no package.json', async () => {
    vol.fromJSON({ '/repo/apps/app/app.json': '{}' });
    expect(await resolveLinkedDependencyPathsAsync(projectRoot)).toEqual([]);
  });
});
