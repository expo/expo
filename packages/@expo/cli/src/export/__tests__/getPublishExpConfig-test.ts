import { vol } from 'memfs';

import { getPublishExpConfigAsync } from '../getPublishExpConfig';

jest.mock('fs');

describe(getPublishExpConfigAsync, () => {
  afterAll(() => {
    vol.reset();
  });

  const runtimeVersion = 'one';
  const sdkVersion = '40.0.0';
  it('Passes if sdkVersion is not specified', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({}),
        'app.json': JSON.stringify({
          name: 'hello',
          slug: 'hello',
          version: '1.0.0',
          runtimeVersion,
          platforms: [],
        }),
      },
      'runtimeVersion'
    );
    const config = await getPublishExpConfigAsync('runtimeVersion', { releaseChannel: 'default' });
    expect(config.exp).toMatchObject({ sdkVersion: undefined, runtimeVersion });
  });
  it('reads sdkVersion from node module', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({}),
        'app.json': JSON.stringify({
          name: 'hello',
          slug: 'hello',
          version: '1.0.0',
          platforms: [],
        }),
        'node_modules/expo/package.json': JSON.stringify({
          version: sdkVersion,
        }),
      },
      'sdkVersion'
    );
    const config = await getPublishExpConfigAsync('sdkVersion', { releaseChannel: 'default' });
    expect(config.exp).toMatchObject({ sdkVersion });
  });
  it('reads sdkVersion from app.json', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({}),
        'app.json': JSON.stringify({
          name: 'hello',
          slug: 'hello',
          version: '1.0.0',
          sdkVersion,
          platforms: [],
        }),
      },
      'sdkVersionInAppDotJson'
    );
    const config = await getPublishExpConfigAsync('sdkVersionInAppDotJson', {
      releaseChannel: 'default',
    });
    expect(config.exp).toMatchObject({ sdkVersion });
  });
});
