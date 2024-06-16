import assert from 'assert';
import fs from 'fs';
import path from 'path';
import semver from 'semver';

import { ExpoVersionMappings } from '../../../utils/expoVersionMappings';
import { setModulesMainApplication } from '../withAndroidModulesMainApplication';

const fixturesPath = path.resolve(__dirname, 'fixtures');

describe(setModulesMainApplication, () => {
  it('should able to update from react-native@>=0.74.0 kotlin template', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn074.kt'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn074-updated.kt'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.74.0');
    const contents = setModulesMainApplication(sdkVersion, rawContents, 'kt');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainApplication(sdkVersion, contents, 'kt');
    expect(nextContents).toEqual(expectContents);
  });

  it('should able to update from react-native@>=0.73.0 kotlin template', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn073.kt'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn073-updated.kt'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.73.0');
    const contents = setModulesMainApplication(sdkVersion, rawContents, 'kt');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainApplication(sdkVersion, contents, 'kt');
    expect(nextContents).toEqual(expectContents);
  });

  it('should able to update from react-native@>=0.71.0 template', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn071.java'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn071-updated.java'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.71.0');
    const contents = setModulesMainApplication(sdkVersion, rawContents, 'java');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainApplication(sdkVersion, contents, 'java');
    expect(nextContents).toEqual(expectContents);
  });

  it('should able to update from react-native@>=0.68.0 template', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn068.java'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn068-updated.java'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.68.0');
    const contents = setModulesMainApplication(sdkVersion, rawContents, 'java');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainApplication(sdkVersion, contents, 'java');
    expect(nextContents).toEqual(expectContents);
  });

  it('should able to update from react-native@<0.68.0 template', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn064.java'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn064-updated.java'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.64.0');
    const contents = setModulesMainApplication(sdkVersion, rawContents, 'java');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainApplication(sdkVersion, contents, 'java');
    expect(nextContents).toEqual(expectContents);
  });

  it('should support another manually modified kotlin version MainApplication', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn064.kt'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn064-updated.kt'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.64.0');
    const contents = setModulesMainApplication(sdkVersion, rawContents, 'kt');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainApplication(sdkVersion, contents, 'kt');
    expect(nextContents).toEqual(expectContents);
  });
});

function getSdkVersion(reactNativeVersion: string): string {
  const versionInfo = ExpoVersionMappings.find((info) =>
    semver.satisfies(reactNativeVersion, info.reactNativeVersionRange)
  );
  assert(versionInfo, `Unsupported react-native version: ${reactNativeVersion}`);
  return versionInfo?.expoSdkVersion;
}
