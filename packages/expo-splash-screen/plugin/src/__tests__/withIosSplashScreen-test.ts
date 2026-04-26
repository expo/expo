import plist from '@expo/plist';
import { ExpoConfig } from 'expo/config';
import { compileModsAsync } from 'expo/config-plugins';
import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import { withIosSplashScreen } from '../withIosSplashScreen';
import projectFixtures from './fixtures/react-native-project';

const fsReal = jest.requireActual('fs') as typeof fs;

jest.mock('fs');

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningIOS: jest.fn() },
  };
});

jest.mock('@expo/image-utils', () => ({
  generateImageAsync: jest.fn().mockResolvedValue({ source: Buffer.from('PNG') }),
}));

function getDirFromFS(fsJSON: Record<string, string | null>, rootDir: string) {
  return Object.entries(fsJSON)
    .filter((entry): entry is [string, string] => {
      const [path, value] = entry;
      return value !== null && path.startsWith(rootDir);
    })
    .reduce<Record<string, string>>(
      (acc, [path, fileContent]) => ({
        ...acc,
        [path.substring(rootDir.length).startsWith('/')
          ? path.substring(rootDir.length + 1)
          : path.substring(rootDir.length)]: fileContent,
      }),
      {}
    );
}

describe(withIosSplashScreen, () => {
  const iconPath = path.resolve(__dirname, './fixtures/icon.png');
  const icon = fsReal.readFileSync(iconPath, 'utf8');
  const projectRoot = '/app';
  beforeEach(async () => {
    vol.fromJSON(
      {
        ...projectFixtures,
        'assets/splash.png': icon,
      },
      projectRoot
    );
  });

  afterEach(() => {
    vol.reset();
  });

  it(`supports color only mode`, async () => {
    let config: ExpoConfig = {
      name: 'foo',
      slug: 'bar',
      _internal: { projectRoot },
    };

    // Apply the splash plugin
    config = withIosSplashScreen(config, {
      // must use full path for mock fs
      image: undefined,
      resizeMode: 'contain',
      backgroundColor: '#ff00ff',
      dark: {
        image: undefined,
        backgroundColor: undefined,
      },
      // userInterfaceStyle: 'automatic',
    });

    // compile all plugins and mods
    config = await compileModsAsync(config, {
      projectRoot,
      platforms: ['ios'],
      assertMissingModProviders: false,
    });

    // Test Results

    expect(config).toBeDefined();

    const infoPlist = await readPlistAsync('/app/ios/HelloWorld/Info.plist');
    expect(infoPlist.UILaunchStoryboardName).toBe('SplashScreen');

    const after = getDirFromFS(vol.toJSON(), path.posix.join(projectRoot, 'ios'));

    // Image is not defined
    expect(
      after['HelloWorld/Images.xcassets/SplashScreenLogo.imageset/image.png']
    ).not.toBeDefined();
  });

  it(`runs entire process`, async () => {
    let config: ExpoConfig = {
      name: 'foo',
      slug: 'bar',
      _internal: { projectRoot },
    };

    // Apply the splash plugin
    config = withIosSplashScreen(config, {
      // must use full path for mock fs
      image: '/app/assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ff00ff',
      dark: {
        image: '/app/assets/splash.png',
        backgroundColor: '#00ff00',
      },
      // userInterfaceStyle: 'automatic',
    });

    // compile all plugins and mods
    config = await compileModsAsync(config, { projectRoot, platforms: ['ios', 'android'] });

    // Test Results
    expect(config).toBeDefined();

    const infoPlist = await readPlistAsync('/app/ios/HelloWorld/Info.plist');
    expect(infoPlist.UILaunchStoryboardName).toBe('SplashScreen');

    const after = getDirFromFS(vol.toJSON(), path.posix.join(projectRoot, 'ios'));

    // Image is defined
    expect(after['HelloWorld/Images.xcassets/SplashScreenLogo.imageset/image.png']).toBeDefined();

    // Ensure images are created
    expect(after['HelloWorld/Images.xcassets/SplashScreenLogo.imageset/image@2x.png']).toMatch(
      /PNG/
    );
    expect(after['HelloWorld/Images.xcassets/SplashScreenLogo.imageset/image@3x.png']).toMatch(
      /PNG/
    );

    // Image JSON
    expect(
      after['HelloWorld/Images.xcassets/SplashScreenLogo.imageset/Contents.json']
    ).toBeDefined();

    // Test the splash screen XML
    expect(after['HelloWorld/SplashScreen.storyboard']).toMatch(/contentMode="scaleAspectFit"/);
    expect(after['HelloWorld/SplashScreen.storyboard']).toMatch(/id="EXPO-SplashScreen"/);
  });
});

function readPlistAsync(plistPath: string) {
  const rawPlist = fs.readFileSync(plistPath, 'utf8');
  return plist.parse(rawPlist);
}
