import fs from 'fs';
import path from 'path';

import { getLatestSdkVersion, getSdkVersion } from '../../../utils/expoVersionMappings';
import { updateVirtualMetroEntryIos } from '../../cli/withCliIntegration';
import {
  updateModulesAppDelegateObjcHeader,
  updateModulesAppDelegateObjcImpl,
  updateModulesAppDelegateSwift,
} from '../withIosModulesAppDelegate';

const fixturesPath = path.resolve(__dirname, 'fixtures');

describe(updateModulesAppDelegateObjcHeader, () => {
  it('should migrate from react-native@>=0.79.0 AppDelegate.swift', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn079.swift'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn079-updated.swift'), 'utf8'),
    ]);

    const sdkVersion = getLatestSdkVersion().sdkVersion;
    const contents = updateModulesAppDelegateSwift(rawContents, sdkVersion);
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateModulesAppDelegateSwift(contents, sdkVersion);
    expect(nextContents).toEqual(expectContents);
  });

  it('should migrate from react-native@>=0.71.0 AppDelegate header', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn071.h'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn071-updated.h'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.71.0');
    const contents = updateModulesAppDelegateObjcHeader(rawContents, sdkVersion);
    expect(updateModulesAppDelegateObjcHeader(contents, sdkVersion)).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateModulesAppDelegateObjcHeader(contents, sdkVersion);
    expect(updateModulesAppDelegateObjcHeader(nextContents, sdkVersion)).toEqual(expectContents);
  });

  it('should migrate from classic RN AppDelegate header', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn067.h'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn067-updated.h'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.67.0');
    const contents = updateModulesAppDelegateObjcHeader(rawContents, sdkVersion);
    expect(updateModulesAppDelegateObjcHeader(contents, sdkVersion)).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateModulesAppDelegateObjcHeader(contents, sdkVersion);
    expect(updateModulesAppDelegateObjcHeader(nextContents, sdkVersion)).toEqual(expectContents);
  });
});

describe(updateModulesAppDelegateObjcImpl, () => {
  it('should migrate from classic react-native@>=0.68.0 AppDelegate.mm implementation', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn068.mm'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn068-updated.mm'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.68.0');
    const contents = updateModulesAppDelegateObjcImpl(rawContents, sdkVersion);
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateModulesAppDelegateObjcImpl(contents, sdkVersion);
    expect(nextContents).toEqual(expectContents);
  });

  it('should migrate from classic react-native@<0.68.0 AppDelegate.m implementation', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn067.m'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn067-updated.m'), 'utf8'),
    ]);

    const sdkVersion = getSdkVersion('0.67.0');
    const contents = updateModulesAppDelegateObjcImpl(rawContents, sdkVersion);
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = updateModulesAppDelegateObjcImpl(contents, sdkVersion);
    expect(nextContents).toEqual(expectContents);
  });
});

describe(updateModulesAppDelegateSwift, () => {
  it('should migrate from RN 0.77 AppDelegate.swift', async () => {
    const rawContents = await fs.promises.readFile(
      path.join(fixturesPath, 'AppDelegate-rn077.swift'),
      'utf8'
    );

    const sdkVersion = getSdkVersion('0.77.0');
    expect(updateModulesAppDelegateSwift(rawContents, sdkVersion)).toMatchSnapshot();
  });

  it('should migrate from RN 0.77 AppDelegate.swift with CLI integration', async () => {
    const rawContents = await fs.promises.readFile(
      path.join(fixturesPath, 'AppDelegate-rn077.swift'),
      'utf8'
    );

    const sdkVersion = getSdkVersion('0.77.0');
    let expectedContents = updateModulesAppDelegateSwift(rawContents, sdkVersion);
    expectedContents = updateVirtualMetroEntryIos(expectedContents);
    expect(expectedContents).toMatchSnapshot();
  });

  it('should migrate from legacy RN AppDelegate.swift', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn067.swift'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'AppDelegate-rn067-updated.swift'), 'utf8'),
    ]);

    const sdkVersion = '44.0.0';
    expect(updateModulesAppDelegateSwift(rawContents, sdkVersion)).toEqual(expectContents);
  });
});

describe('withIosModulesAppDelegate sdkVersion snapshots', () => {
  const [objcHeaderFixture, objcImplFixture, swiftFixture] = [
    fs.readFileSync(path.join(fixturesPath, 'AppDelegate-rn067.h'), 'utf8'),
    fs.readFileSync(path.join(fixturesPath, 'AppDelegate-rn067.m'), 'utf8'),
    fs.readFileSync(path.join(fixturesPath, 'AppDelegate-rn067.swift'), 'utf8'),
  ];

  ['43.0.0', '44.0.0'].forEach((sdkVersion) => {
    it(`sdkVersion ${sdkVersion}`, () => {
      expect(updateModulesAppDelegateObjcHeader(objcHeaderFixture, sdkVersion)).toMatchSnapshot();
      expect(updateModulesAppDelegateObjcImpl(objcImplFixture, sdkVersion)).toMatchSnapshot();
      expect(updateModulesAppDelegateSwift(swiftFixture, sdkVersion)).toMatchSnapshot();
    });
  });
});
