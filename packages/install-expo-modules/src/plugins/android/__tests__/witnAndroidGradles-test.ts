import fs from 'fs';
import path from 'path';

import { updateAndroidProjectBuildGradle } from '../withAndroidGradles';

const fixturesPath = path.resolve(__dirname, 'fixtures');

describe(updateAndroidProjectBuildGradle, () => {
  it(`should be able to update build.gradle for react-native@0.79.0`, async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'ProjectBuild-rn079.gradle'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'ProjectBuild-rn079-updated.gradle'), 'utf8'),
    ]);

    const contents = updateAndroidProjectBuildGradle({
      contents: rawContents,
      isGroovy: true,
      sdkVersion: '53.0.0',
    });
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateAndroidProjectBuildGradle({
      contents,
      isGroovy: true,
      sdkVersion: '53.0.0',
    });
    expect(nextContents).toEqual(expectContents);
  });
});
