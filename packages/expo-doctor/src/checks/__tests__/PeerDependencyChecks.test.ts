import { vol } from 'memfs';

import { PeerDependencyChecks } from '../PeerDependencyChecks';

jest.mock('fs');

const projectRoot = '/tmp/project';

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
  },
  projectRoot,
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

describe('PeerDependencyChecks', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('returns successful result when no dependencies exist', async () => {
    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: { name: 'test-project', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toHaveLength(0);
  });

  it('returns successful result when dependencies have no peer dependencies', async () => {
    // Mock a package.json for a dependency without peer dependencies
    vol.fromJSON({
      [`${projectRoot}/node_modules/some-package/package.json`]: JSON.stringify({
        name: 'some-package',
        version: '1.0.0',
      }),
    });

    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'some-package': '^1.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toHaveLength(0);
  });

  it('detects missing required peer dependencies', async () => {
    // Mock a package.json for a dependency with peer dependencies
    vol.fromJSON({
      [`${projectRoot}/node_modules/react-hook-form/package.json`]: JSON.stringify({
        name: 'react-hook-form',
        version: '7.0.0',
        peerDependencies: {
          react: '>=16.8.0',
          'react-dom': '>=16.8.0',
        },
      }),
    });

    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'react-hook-form': '^7.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0]).toContain('Required peer dependency "react');
    expect(result.issues[1]).toContain('Required peer dependency "react-dom');
  });

  it('ignores optional peer dependencies', async () => {
    // Mock a package.json for a dependency with optional peer dependencies
    vol.fromJSON({
      [`${projectRoot}/node_modules/some-ui-lib/package.json`]: JSON.stringify({
        name: 'some-ui-lib',
        version: '1.0.0',
        peerDependencies: {
          'styled-components': '^5.0.0',
        },
        peerDependenciesMeta: {
          'styled-components': {
            optional: true,
          },
        },
      }),
    });

    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'some-ui-lib': '^1.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toHaveLength(0);
  });

  it('does not check version compatibility for installed peer dependencies', async () => {
    // Mock a package.json for a dependency with peer dependencies
    vol.fromJSON({
      [`${projectRoot}/node_modules/react-hook-form/package.json`]: JSON.stringify({
        name: 'react-hook-form',
        version: '7.0.0',
        peerDependencies: {
          react: '^18.0.0',
        },
      }),
    });

    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'react-hook-form': '^7.0.0',
          react: '^17.0.0', // Version that doesn't satisfy ^18.0.0, but should not be flagged
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toHaveLength(0);
  });

  it('handles missing package.json gracefully', async () => {
    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'non-existent-package': '^1.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toHaveLength(0);
  });

  it('provides helpful advice when issues are found', async () => {
    // Mock a package.json for a dependency with peer dependencies
    vol.fromJSON({
      [`${projectRoot}/node_modules/react-hook-form/package.json`]: JSON.stringify({
        name: 'react-hook-form',
        version: '7.0.0',
        peerDependencies: {
          react: '>=16.8.0',
        },
      }),
    });

    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'react-hook-form': '^7.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.advice).toHaveLength(1);
    expect(result.advice[0]).toContain('Install missing required peer dependencies');
  });
}); 