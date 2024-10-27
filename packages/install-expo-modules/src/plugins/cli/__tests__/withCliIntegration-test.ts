import fs from 'fs';
import path from 'path';
import { ISA, PBXShellScriptBuildPhase, build as xcbuild, parse as xcparse } from 'xcparse';

import {
  updateAndroidGradleFile,
  updateBabelConfig,
  updateGitIgnore,
  updateIosXcodeProjectBuildPhase,
  updateMetroConfig,
  updateVirtualMetroEntryAndroid,
  updateVirtualMetroEntryIos,
} from '../withCliIntegration';

const fixturesPath = path.resolve(__dirname, 'fixtures');

describe(updateAndroidGradleFile, () => {
  it('should update the `android/app/build.gradle` file', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'appBuild-rn072.gradle'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'appBuild-rn072-updated.gradle'), 'utf8'),
    ]);
    expect(updateAndroidGradleFile(rawContents)).toEqual(expectContents);
  });
});

describe(updateBabelConfig, () => {
  it('should update the `babel.config.js` file', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'babel-config-rn072.js'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'babel-config-rn072-updated.js'), 'utf8'),
    ]);
    expect(updateBabelConfig(rawContents)).toEqual(expectContents);
  });
});

describe(updateMetroConfig, () => {
  it('should update the `metro.config.js` file', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'metro-config-rn072.js'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'metro-config-rn072-updated.js'), 'utf8'),
    ]);
    expect(updateMetroConfig(rawContents)).toEqual(expectContents);
  });

  it('should show warning if the `metro.config.js` content is unrecognized', async () => {
    const rawContents = await fs.promises.readFile(
      path.join(fixturesPath, 'metro-config-rn071.js'),
      'utf8'
    );
    const spy = jest.spyOn(console, 'warn');
    expect(updateMetroConfig(rawContents)).toEqual(rawContents);
    expect(spy).toBeCalled();
  });
});

describe(updateVirtualMetroEntryAndroid, () => {
  it('should update the `MainApplication.java` for virtual-metro-point', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn072.java'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn072-updated.java'), 'utf8'),
    ]);
    expect(updateVirtualMetroEntryAndroid(rawContents)).toEqual(expectContents);
  });
});

describe(updateVirtualMetroEntryIos, () => {
  it('should update the `AppDelegate.mm` for virtual-metro-point', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn072.mm'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn072-updated.mm'), 'utf8'),
    ]);
    expect(updateVirtualMetroEntryIos(rawContents)).toEqual(expectContents);
  });
});

describe(updateIosXcodeProjectBuildPhase, () => {
  it('should update the `ios/{projectName}.xcodeproj/project.pbxproj` file', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'xcodeProject-rn072.pbxproj'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'xcodeProject-rn072-updated.pbxproj'), 'utf8'),
    ]);
    const pbxproj = xcparse(rawContents);
    for (const section of Object.values(pbxproj.objects ?? {})) {
      if (section.isa === ISA.PBXShellScriptBuildPhase) {
        updateIosXcodeProjectBuildPhase(section as PBXShellScriptBuildPhase);
      }
    }
    expect(xcbuild(pbxproj)).toEqual(expectContents);
  });
});

describe(updateGitIgnore, () => {
  it('should update the `.gitignore` file', async () => {
    const rawContents = `\
# node.js
#
node_modules/
npm-debug.log
yarn-error.log
`;
    expect(updateGitIgnore(rawContents)).toMatchInlineSnapshot(`
      "# node.js
      #
      node_modules/
      npm-debug.log
      yarn-error.log

      # Expo
      .expo
      dist/
      web-build/"
    `);
  });
});
