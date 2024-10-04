import { AndroidConfig } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import {
  ADAPTIVE_ICON_XML_WITH_BACKGROUND_COLOR,
  ADAPTIVE_ICON_XML_WITH_BACKGROUND_COLOR_AND_MONOCHROME,
  ADAPTIVE_ICON_XML_WITH_BOTH,
  ADAPTIVE_ICON_XML_WITH_BOTH_AND_MONOCHROME,
  LIST_OF_ANDROID_ADAPTIVE_ICON_FILES_FINAL,
  SAMPLE_COLORS_XML,
} from '../../__tests__/fixtures/androidIcons';
import rnFixture from '../../__tests__/fixtures/react-native-project';
import { getDirFromFS } from '../../__tests__/getDirFromFS';
import {
  createAdaptiveIconXmlString,
  getAdaptiveIcon,
  getIcon,
  setIconAsync,
  setRoundIconManifest,
} from '../withAndroidIcons';

const { getMainApplicationOrThrow, readAndroidManifestAsync } = AndroidConfig.Manifest;
const fsReal = jest.requireActual('fs') as typeof fs;

jest.mock('fs');

function setUpMipmapDirectories() {
  vol.mkdirpSync('/app/android/app/src/main/res/mipmap-mdpi');
  vol.mkdirpSync('/app/android/app/src/main/res/mipmap-hdpi');
  vol.mkdirpSync('/app/android/app/src/main/res/mipmap-xhdpi');
  vol.mkdirpSync('/app/android/app/src/main/res/mipmap-xxhdpi');
  vol.mkdirpSync('/app/android/app/src/main/res/mipmap-xxxhdpi');
}

describe(setRoundIconManifest, () => {
  vol.fromJSON({ './AndroidManifest.xml': rnFixture['android/app/src/main/AndroidManifest.xml'] });
  it(`adds the round icon property when an adaptive icon is present`, async () => {
    const manifest = await readAndroidManifestAsync('./AndroidManifest.xml');
    const results = setRoundIconManifest({ android: { adaptiveIcon: {} } }, manifest);

    const app = getMainApplicationOrThrow(results);
    expect(app.$['android:roundIcon']).toBe('@mipmap/ic_launcher_round');
  });
  it(`removes the round icon property when an adaptive icon is missing`, async () => {
    const manifest = await readAndroidManifestAsync('./AndroidManifest.xml');
    const results = setRoundIconManifest({ android: {} }, manifest);

    const app = getMainApplicationOrThrow(results);
    expect(app.$['android:roundIcon']).not.toBeDefined();
  });
});

describe('Android Icon', () => {
  it(`returns null if no icon values provided`, () => {
    expect(getIcon({} as ExpoConfig)).toBeNull();
    expect(getAdaptiveIcon({} as ExpoConfig)).toMatchObject({
      foregroundImage: null,
      backgroundColor: null,
      backgroundImage: null,
    });
  });

  it(`returns adaptive icon over android icon`, () => {
    const config = {
      icon: 'icon',
      android: {
        icon: 'androidIcon',
        adaptiveIcon: {
          foregroundImage: 'adaptiveIcon',
          backgroundImage: 'backgroundImage',
          backgroundColor: '#000000',
        },
      },
    };
    const { foregroundImage, backgroundColor, backgroundImage } = getAdaptiveIcon(
      config as ExpoConfig
    );
    const icon = foregroundImage || getIcon(config as ExpoConfig);
    expect(icon).toMatch('adaptiveIcon');
    expect(backgroundColor).toMatch('#000000');
    expect(backgroundImage).toMatch('backgroundImage');
  });

  it(`creates the proper AdaptiveIconXmlString`, () => {
    const withBackgroundImage = createAdaptiveIconXmlString('path/to/image', null);
    const withBackgroundColor = createAdaptiveIconXmlString(null, null);
    const withBackgroundColorAndMonochrome = createAdaptiveIconXmlString(null, 'path/to/image');
    const withBoth = createAdaptiveIconXmlString('path/to/image', null);
    const withBothAndMonochrome = createAdaptiveIconXmlString('path/to/image', 'path/to/image');

    expect(withBackgroundColor).toBe(ADAPTIVE_ICON_XML_WITH_BACKGROUND_COLOR);
    expect(withBackgroundColorAndMonochrome).toBe(
      ADAPTIVE_ICON_XML_WITH_BACKGROUND_COLOR_AND_MONOCHROME
    );
    expect(withBackgroundImage).toBe(ADAPTIVE_ICON_XML_WITH_BOTH);
    expect(withBoth).toBe(ADAPTIVE_ICON_XML_WITH_BOTH);
    expect(withBothAndMonochrome).toBe(ADAPTIVE_ICON_XML_WITH_BOTH_AND_MONOCHROME);
  });

  it('returns null if no icon config provided', async () => {
    expect(
      await setIconAsync('./', {
        icon: null,
        backgroundImage: null,
        backgroundColor: null,
        isAdaptive: false,
        monochromeImage: null,
      })
    ).toBe(null);
  });
});

describe('e2e: ONLY android legacy icon', () => {
  const legacyIconPath = path.resolve(__dirname, '../../__tests__/fixtures/icon.png');
  const projectRoot = '/app';
  const icon = require('../../icons/withAndroidIcons');
  const spyOnConfigureAdaptiveIconAsync = jest.spyOn(icon, 'configureAdaptiveIconAsync');
  beforeAll(async () => {
    const icon = fsReal.readFileSync(legacyIconPath);
    vol.fromJSON(
      { './android/app/src/main/res/values/colors.xml': SAMPLE_COLORS_XML },
      projectRoot
    );
    setUpMipmapDirectories();
    vol.mkdirpSync('/app/assets');
    vol.writeFileSync('/app/assets/iconForeground.png', icon);

    await setIconAsync(projectRoot, {
      icon: '/app/assets/iconForeground.png',
      backgroundColor: null,
      backgroundImage: null,
      isAdaptive: true,
      monochromeImage: null,
    });
  });

  afterAll(() => {
    vol.reset();
  });

  it('writes all the image files expected', async () => {
    const after = getDirFromFS(vol.toJSON(), projectRoot);
    Object.keys(after).forEach((path) => {
      expect(LIST_OF_ANDROID_ADAPTIVE_ICON_FILES_FINAL).toContain(path);
    });
  });

  it('Does not set adaptive icon config', () => {
    expect(spyOnConfigureAdaptiveIconAsync).toHaveBeenCalledTimes(0);
  });
});

describe('e2e: android adaptive icon', () => {
  const adaptiveIconForegroundPath = path.resolve(__dirname, '../../__tests__/fixtures/icon.png');
  const adaptiveIconBackgroundPath = path.resolve(__dirname, '../../__tests__/fixtures/icon.png');
  const adaptiveIconMonochromePath = path.resolve(__dirname, '../../__tests__/fixtures/icon.png');
  const projectRoot = '/app';

  beforeAll(async () => {
    const adaptiveIconForeground = fsReal.readFileSync(adaptiveIconForegroundPath);
    const adaptiveIconBackground = fsReal.readFileSync(adaptiveIconBackgroundPath);
    const adaptiveIconMonochrome = fsReal.readFileSync(adaptiveIconMonochromePath);

    vol.fromJSON(
      { './android/app/src/main/res/values/colors.xml': SAMPLE_COLORS_XML },
      projectRoot
    );
    setUpMipmapDirectories();
    vol.mkdirpSync('/app/assets');
    vol.writeFileSync('/app/assets/iconForeground.png', adaptiveIconForeground);
    vol.writeFileSync('/app/assets/iconBackground.png', adaptiveIconBackground);
    vol.writeFileSync('/app/assets/iconMonochrome.png', adaptiveIconMonochrome);

    await setIconAsync(projectRoot, {
      icon: '/app/assets/iconForeground.png',
      backgroundImage: '/app/assets/iconBackground.png',
      backgroundColor: '#123456',
      isAdaptive: true,
      monochromeImage: '/app/assets/iconMonochrome.png',
    });
  });

  afterAll(() => {
    vol.reset();
  });

  it('writes all the image files expected', () => {
    const after = getDirFromFS(vol.toJSON(), projectRoot);
    expect(Object.keys(after)).toEqual(LIST_OF_ANDROID_ADAPTIVE_ICON_FILES_FINAL);
  });
});
