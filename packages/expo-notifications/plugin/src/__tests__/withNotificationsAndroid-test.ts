import { ExpoConfig } from 'expo/config';
import { fs, vol } from 'memfs';
import * as path from 'path';

import {
  getNotificationColor,
  getNotificationIcon,
  setNotificationIconAsync,
  setNotificationSounds,
} from '../withNotificationsAndroid';

export function getDirFromFS(fsJSON: Record<string, string | null>, rootDir: string) {
  return Object.entries(fsJSON)
    .filter(([path, value]) => value !== null && path.startsWith(rootDir))
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

const SAMPLE_COLORS_XML = `<?xml version="1.0" encoding="utf-8"?>
    <resources>
      <!-- Below line is handled by '@expo/configure-splash-screen' command and it's discouraged to modify it manually -->
      <color name="splashscreen_background">#FFFFFF</color>
    </resources>
    `;

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
  'assets/notificationSound.wav',
  'android/app/src/main/res/raw/notificationSound.wav',
];

const iconPath = path.resolve(__dirname, './fixtures/icon.png');
const soundPath = path.resolve(__dirname, './fixtures/cat.wav');

const projectRoot = '/app';

describe('Android notifications configuration', () => {
  beforeEach(async () => {
    const icon = fsReal.readFileSync(iconPath);
    const sound = fsReal.readFileSync(soundPath);
    vol.fromJSON(
      { './android/app/src/main/res/values/colors.xml': SAMPLE_COLORS_XML },
      projectRoot
    );
    setUpDrawableDirectories();
    vol.mkdirpSync('/app/assets');
    vol.writeFileSync('/app/assets/notificationIcon.png', icon);
    vol.writeFileSync('/app/assets/notificationSound.wav', sound);
  });

  afterEach(() => {
    vol.reset();
  });

  afterAll(() => {
    jest.unmock('@expo/image-utils');
    jest.unmock('fs');
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

  it('writes all the asset files (sounds and images) as expected', async () => {
    await setNotificationIconAsync(projectRoot, '/app/assets/notificationIcon.png');
    setNotificationSounds(projectRoot, ['/app/assets/notificationSound.wav']);

    const after = getDirFromFS(vol.toJSON(), projectRoot);
    expect(Object.keys(after).sort()).toEqual(LIST_OF_GENERATED_NOTIFICATION_FILES.sort());
  });

  it('Safely remove icon if it exists, and ignore if it doesnt', async () => {
    const before = getDirFromFS(vol.toJSON(), projectRoot);
    // first set the icon
    await setNotificationIconAsync(projectRoot, '/app/assets/notificationIcon.png');

    // now remove
    await setNotificationIconAsync(projectRoot, null);

    const after = getDirFromFS(vol.toJSON(), projectRoot);
    expect(before).toMatchObject(after);

    // now remove again to make sure we don't throw in that case
    await setNotificationIconAsync(projectRoot, null);

    const final = getDirFromFS(vol.toJSON(), projectRoot);
    expect(before).toMatchObject(final);
  });
});

function setUpDrawableDirectories() {
  vol.mkdirpSync('/app/android/app/src/main/res/drawable-mdpi');
  vol.mkdirpSync('/app/android/app/src/main/res/drawable-hdpi');
  vol.mkdirpSync('/app/android/app/src/main/res/drawable-xhdpi');
  vol.mkdirpSync('/app/android/app/src/main/res/drawable-xxhdpi');
  vol.mkdirpSync('/app/android/app/src/main/res/drawable-xxxhdpi');
}
