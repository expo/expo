import { vol } from 'memfs';

import { createLinkedDependencyMatcher } from '../LinkedDependencies';

jest.mock('fs');

describe(createLinkedDependencyMatcher, () => {
  const projectRoot = '/repo/apps/app';

  beforeEach(() => {
    vol.fromJSON({
      '/repo/apps/app/package.json': JSON.stringify({
        dependencies: { 'my-plugin': 'workspace:*', expo: '^54.0.0' },
      }),
      '/repo/packages/my-plugin/package.json': JSON.stringify({ name: 'my-plugin' }),
      '/repo/packages/@expo/config/package.json': JSON.stringify({ name: '@expo/config' }),
    });
  });

  afterEach(() => {
    vol.reset();
  });

  it('should match a file of a declared dependency outside node_modules', () => {
    const isLinkedDependencyFile = createLinkedDependencyMatcher(projectRoot);
    expect(isLinkedDependencyFile('../../packages/my-plugin/index.js')).toBe(true);
    expect(isLinkedDependencyFile('../../packages/my-plugin/src/deep/util.js')).toBe(true);
  });

  it('should not match a file of a package the project does not declare', () => {
    const isLinkedDependencyFile = createLinkedDependencyMatcher(projectRoot);
    expect(isLinkedDependencyFile('../../packages/@expo/config/build/index.js')).toBe(false);
  });

  it('should not match a file inside a nested node_modules of a declared dependency', () => {
    const isLinkedDependencyFile = createLinkedDependencyMatcher(projectRoot);
    expect(isLinkedDependencyFile('../../packages/my-plugin/node_modules/dep/index.js')).toBe(
      false
    );
  });

  it('should match nothing when the project has no package.json', () => {
    vol.reset();
    vol.fromJSON({
      '/repo/packages/my-plugin/package.json': JSON.stringify({ name: 'my-plugin' }),
    });
    const isLinkedDependencyFile = createLinkedDependencyMatcher(projectRoot);
    expect(isLinkedDependencyFile('../../packages/my-plugin/index.js')).toBe(false);
  });
});
