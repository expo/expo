import { ExpoConfig } from '@expo/config';
import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import { withGradleProperties } from '../android-plugins';
import { evalModsAsync } from '../mod-compiler';
import { getAndroidModFileProviders, withAndroidBaseMods } from '../withAndroidBaseMods';
import rnFixture from './fixtures/react-native-project';

jest.mock('fs');

describe(withGradleProperties, () => {
  const projectRoot = '/app';

  beforeEach(async () => {
    vol.fromJSON(
      {
        ...rnFixture,
      },
      projectRoot
    );
  });

  afterEach(() => {
    vol.reset();
  });

  it(`is passed gradle.properties`, async () => {
    let config: ExpoConfig = {
      name: 'foobar',
      slug: 'foobar',
    };

    config = withGradleProperties(config, config => {
      config.modResults.push({ type: 'comment', value: 'expo-test' });
      config.modResults.push({ type: 'empty' });
      config.modResults.push({ type: 'property', key: 'foo', value: 'bar' });
      config.modResults.push({ type: 'empty' });
      config.modResults.push({ type: 'comment', value: 'end-expo-test' });
      return config;
    });
    config = withAndroidBaseMods(config, {
      providers: {
        gradleProperties: getAndroidModFileProviders().gradleProperties,
      },
    });

    await evalModsAsync(config, {
      projectRoot,
      platforms: ['android'],
      assertMissingModProviders: true,
    });

    const contents = fs.readFileSync(path.join(projectRoot, 'android/gradle.properties'), 'utf8');
    expect(contents.endsWith('# expo-test\n\nfoo=bar\n\n# end-expo-test')).toBe(true);
  });
});
