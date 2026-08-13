import { vol } from 'memfs';

import { getHermesVersion } from '../hermesVersion';

jest.mock('fs');
jest.mock('resolve-from');

const projectRoot = '/tmp/project';

describe(getHermesVersion, () => {
  afterEach(() => {
    vol.reset();
  });

  it('reads the Hermes V1 version from React Native version.properties', () => {
    vol.fromJSON({
      [`${projectRoot}/node_modules/react-native/package.json`]: JSON.stringify({
        version: '0.86.0',
      }),
      [`${projectRoot}/node_modules/react-native/sdks/hermes-engine/version.properties`]:
        'HERMES_VERSION_NAME=0.17.0\nHERMES_V1_VERSION_NAME=250829098.0.14\n',
    });

    expect(getHermesVersion(projectRoot)).toEqual({
      source: 'react-native',
      version: '250829098.0.14',
    });
  });

  it('uses HERMES_VERSION_NAME when there is no separate Hermes V1 property', () => {
    vol.fromJSON({
      [`${projectRoot}/node_modules/react-native/package.json`]: JSON.stringify({
        version: '0.87.0',
      }),
      [`${projectRoot}/node_modules/react-native/sdks/hermes-engine/version.properties`]:
        'HERMES_VERSION_NAME=250829098.0.15\n',
    });

    expect(getHermesVersion(projectRoot)).toEqual({
      source: 'react-native',
      version: '250829098.0.15',
    });
  });

  it('falls back to the installed hermes-compiler version', () => {
    vol.fromJSON({
      [`${projectRoot}/node_modules/react-native/package.json`]: JSON.stringify({
        version: '0.83.0',
      }),
      [`${projectRoot}/node_modules/react-native/node_modules/hermes-compiler/package.json`]:
        JSON.stringify({
          version: '250829098.0.4',
        }),
    });

    expect(getHermesVersion(projectRoot)).toEqual({
      source: 'hermes-compiler',
      version: '250829098.0.4',
    });
  });

  it('does not resolve hermes-compiler from the project root', () => {
    vol.fromJSON({
      [`${projectRoot}/node_modules/react-native/package.json`]: JSON.stringify({
        version: '0.83.0',
      }),
      [`${projectRoot}/node_modules/hermes-compiler/package.json`]: JSON.stringify({
        version: '250829098.0.4',
      }),
    });

    expect(getHermesVersion(projectRoot)).toBeNull();
  });

  it('fails safely when neither version can be resolved', () => {
    expect(getHermesVersion(projectRoot)).toBeNull();
  });
});
