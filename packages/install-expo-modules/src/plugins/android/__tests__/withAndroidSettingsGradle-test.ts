import fs from 'fs';
import path from 'path';

import { updateAndroidSettingsGradle } from '../withAndroidSettingsGradle';

const fixturesPath = path.resolve(__dirname, 'fixtures');

describe(updateAndroidSettingsGradle, () => {
  it(`should be able to update settings.gradle for react-native@0.74.0`, async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'settings-rn074.gradle'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'settings-rn074-updated.gradle'), 'utf8'),
    ]);

    const contents = updateAndroidSettingsGradle({
      contents: rawContents,
      isGroovy: true,
      sdkVersion: '51.0.0',
    });
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateAndroidSettingsGradle({
      contents,
      isGroovy: true,
      sdkVersion: '51.0.0',
    });
    expect(nextContents).toEqual(expectContents);
  });

  it(`should be able to update settings.gradle for react-native-community/template@0.76.0`, async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'settings-rn076.gradle'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'settings-rn076-updated.gradle'), 'utf8'),
    ]);

    const contents = updateAndroidSettingsGradle({
      contents: rawContents,
      isGroovy: true,
      sdkVersion: '52.0.0',
    });
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateAndroidSettingsGradle({
      contents,
      isGroovy: true,
      sdkVersion: '52.0.0',
    });
    expect(nextContents).toEqual(expectContents);
  });
});
