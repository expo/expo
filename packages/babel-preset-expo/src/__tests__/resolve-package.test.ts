import path from 'path';

import { resolveProjectTransitiveDependency } from '../resolve-package';

describe(resolveProjectTransitiveDependency, () => {
  const expoRoot = path.resolve(__dirname, '../../../..');

  it('should return null if dependency is not found', () => {
    const depPath = resolveProjectTransitiveDependency(expoRoot, 'not-found');
    expect(depPath).toBe(null);
  });

  it('should support direct dependency', () => {
    const depPath = resolveProjectTransitiveDependency(expoRoot, 'react-native');
    expect(depPath).toBe(path.join(expoRoot, 'node_modules/react-native/index.js'));
  });

  it('should support transitive dependency', () => {
    const depPath = resolveProjectTransitiveDependency(
      expoRoot,
      'react-native',
      '@react-native/community-cli-plugin',
      '@react-native/metro-babel-transformer',
      '@react-native/babel-preset'
    );
    expect(depPath).toBe(
      path.join(expoRoot, 'node_modules/@react-native/babel-preset/src/index.js')
    );
  });
});
