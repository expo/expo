import { AndroidConfig } from '@expo/config-plugins';
import { Colors } from '@expo/config-plugins/build/android';
import { readResourcesXMLAsync } from '@expo/config-plugins/build/android/Resources';
import { ExpoConfig } from '@expo/config-types';
import { fs, vol } from 'memfs';
import * as path from 'path';
import { resolve } from 'path';

import { SAMPLE_COLORS_XML } from '../../../__tests__/fixtures/androidIcons';
import { getDirFromFS } from '../../../icons/__tests__/utils/getDirFromFS';
import {
  getNotificationColor,
  getNotificationIcon,
  META_DATA_NOTIFICATION_ICON,
  META_DATA_NOTIFICATION_ICON_COLOR,
  NOTIFICATION_ICON_COLOR_RESOURCE,
  NOTIFICATION_ICON_RESOURCE,
  setNotificationConfig,
  setNotificationIconAsync,
  setNotificationIconColor,
} from '../withAndroidNotifications';

jest.mock('fs');

const fsReal = jest.requireActual('fs') as typeof fs;

const LIST_OF_GENERATED_NOTIFICATION_FILES = [
  'android/app/src/main/res/drawable-mdpi/notification_icon.png',
  'android/app/src/main/res/drawable-hdpi/notification_icon.png',
  'android/app/src/main/res/drawable-xhdpi/notification_icon.png',
  'android/app/src/main/res/drawable-xxhdpi/notification_icon.png',
  'android/app/src/main/res/drawable-xxxhdpi/notification_icon.png',
  'android/app/src/main/res/values/colors.xml',
  'assets/notificationIcon.png',
];
const iconPath = path.resolve(__dirname, '../../../__tests__/fixtures/icon.png');
const projectRoot = '/app';

describe('Android notifications configuration', () => {
  beforeAll(async () => {
    const icon = fsReal.readFileSync(iconPath);
    vol.fromJSON(
      { './android/app/src/main/res/values/colors.xml': SAMPLE_COLORS_XML },
      projectRoot
    );
    setUpDrawableDirectories();
    vol.mkdirpSync('/app/assets');
    vol.writeFileSync('/app/assets/notificationIcon.png', icon);

    const expoConfig: ExpoConfig = {
      slug: 'testproject',
      version: '1',
      name: 'testproject',
      platforms: ['ios', 'android'],
      notification: {
        icon: '/app/assets/notificationIcon.png',
        color: '#00ff00',
      },
    };
    await setNotificationIconAsync(expoConfig, projectRoot);

    setNotificationIconColor(
      expoConfig,
      await readResourcesXMLAsync({
        path: await Colors.getProjectColorsXMLPathAsync(projectRoot, {}),
      })
    );
  });

  afterAll(() => {
    // jest.unmock('@expo/image-utils');
    // jest.unmock('fs');
    vol.reset();
  });

  it(`returns null if no config provided`, () => {
    expect(getNotificationIcon({} as ExpoConfig)).toBeNull();
    expect(getNotificationColor({} as ExpoConfig)).toBeNull();
  });

  it(`returns config if provided`, () => {
    expect(getNotificationIcon({ notification: { icon: './myIcon.png' } } as ExpoConfig)).toMatch(
      './myIcon.png'
    );
    expect(getNotificationColor({ notification: { color: '#123456' } } as ExpoConfig)).toMatch(
      '#123456'
    );
  });

  it('writes all the image files expected', async () => {
    const after = getDirFromFS(vol.toJSON(), projectRoot);
    Object.keys(after).forEach(path => {
      expect(LIST_OF_GENERATED_NOTIFICATION_FILES).toContain(path);
    });
  });
});

function setUpDrawableDirectories() {
  vol.mkdirpSync('/app/android/app/src/main/res/drawable-mdpi');
  vol.mkdirpSync('/app/android/app/src/main/res/drawable-hdpi');
  vol.mkdirpSync('/app/android/app/src/main/res/drawable-xhdpi');
  vol.mkdirpSync('/app/android/app/src/main/res/drawable-xxhdpi');
  vol.mkdirpSync('/app/android/app/src/main/res/drawable-xxxhdpi');
}

const { getMainApplication } = AndroidConfig.Manifest;

const fixturesPath = resolve(__dirname, '../../../__tests__/fixtures');
const sampleManifestPath = resolve(fixturesPath, 'react-native-AndroidManifest.xml');
const notificationConfig: ExpoConfig = {
  name: 'lol',
  slug: 'lol',
  notification: {
    icon: '/app/assets/notificationIcon.png',
    color: '#00ff00',
  },
};

describe('Applies proper Android Notification configuration to AndroidManifest.xml', () => {
  beforeEach(() => {
    vol.fromJSON({
      './AndroidManifest.xml': fsReal.readFileSync(sampleManifestPath, 'utf-8') as string,
    });
  });
  it('adds config if provided & does not duplicate', async () => {
    let androidManifestJson = await AndroidConfig.Manifest.readAndroidManifestAsync(
      './AndroidManifest.xml'
    );

    androidManifestJson = setNotificationConfig(notificationConfig, androidManifestJson);
    // Run this twice to ensure copies don't get added.
    androidManifestJson = setNotificationConfig(notificationConfig, androidManifestJson);

    const mainApplication = getMainApplication(androidManifestJson);

    const notificationIcon = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === META_DATA_NOTIFICATION_ICON
    );
    expect(notificationIcon).toHaveLength(1);
    expect(notificationIcon[0].$['android:resource']).toMatch(NOTIFICATION_ICON_RESOURCE);

    const notificationColor = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === META_DATA_NOTIFICATION_ICON_COLOR
    );
    expect(notificationColor).toHaveLength(1);
    expect(notificationColor[0].$['android:resource']).toMatch(NOTIFICATION_ICON_COLOR_RESOURCE);
  });

  it('removes existing config if null is provided', async () => {
    let androidManifestJson = await AndroidConfig.Manifest.readAndroidManifestAsync(
      './AndroidManifest.xml'
    );

    androidManifestJson = setNotificationConfig(notificationConfig, androidManifestJson);
    // Now let's get rid of the configuration:
    androidManifestJson = setNotificationConfig({} as ExpoConfig, androidManifestJson);

    const mainApplication = getMainApplication(androidManifestJson);

    const notificationIcon = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === META_DATA_NOTIFICATION_ICON
    );
    expect(notificationIcon).toHaveLength(0);

    const notificationColor = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === META_DATA_NOTIFICATION_ICON_COLOR
    );
    expect(notificationColor).toHaveLength(0);
  });
});
