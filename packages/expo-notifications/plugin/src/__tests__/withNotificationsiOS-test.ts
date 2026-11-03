import { IOSConfig } from 'expo/config-plugins';
import { fs, vol } from 'memfs';
import * as path from 'path';

import { setNotificationSounds } from '../withNotificationsIOS';
import { getDirFromFS } from './withNotificationsAndroid-test';

jest.mock('fs');

const fsReal = jest.requireActual('fs') as typeof fs;

const template = path.join(
  __dirname,
  '../../../../../templates/expo-template-bare-minimum/ios/HelloWorld.xcodeproj/project.pbxproj'
);
const pbxproj = fsReal.readFileSync(template, 'utf-8');
const LIST_OF_GENERATED_FILES = [
  'assets/notificationSound.wav',
  'ios/testproject/notificationSound.wav',
  'ios/testproject.xcodeproj/project.pbxproj',
  'ios/testproject/AppDelegate.m',
];

const soundPath = path.resolve(__dirname, './fixtures/cat.wav');

const projectRoot = '/app';

describe('iOS notifications configuration', () => {
  beforeAll(async () => {
    jest.mock('fs');
    const sound = fsReal.readFileSync(soundPath);
    vol.fromJSON({ 'ios/testproject/AppDelegate.m': '' }, projectRoot);
    vol.mkdirpSync('/app/assets');
    vol.mkdirpSync('/app/ios/testproject.xcodeproj/');
    vol.writeFileSync('/app/assets/notificationSound.wav', sound);
    vol.writeFileSync('/app/ios/testproject.xcodeproj/project.pbxproj', pbxproj);
  });

  afterAll(() => {
    jest.unmock('fs');
    vol.reset();
  });

  it('writes all the asset files (sounds and images) as expected', async () => {
    const project = IOSConfig.XcodeUtils.getPbxproj(projectRoot);
    // TODO: test pbxproj result via snapshot
    setNotificationSounds(projectRoot, {
      sounds: ['/app/assets/notificationSound.wav'],
      project,
      projectName: 'testproject',
    });

    const after = getDirFromFS(vol.toJSON(), projectRoot);
    expect(Object.keys(after).sort()).toEqual(LIST_OF_GENERATED_FILES.sort());
  });
});

describe('tvOS notifications configuration', () => {
  beforeAll(async () => {
    jest.mock('fs');
    const sound = fsReal.readFileSync(soundPath);
    // Both platform directories exist, as they do after prebuilding for ios and tvos.
    vol.fromJSON(
      { 'ios/testproject/AppDelegate.m': '', 'tvos/testproject/AppDelegate.m': '' },
      projectRoot
    );
    vol.mkdirpSync('/app/assets');
    vol.mkdirpSync('/app/ios/testproject.xcodeproj/');
    vol.mkdirpSync('/app/tvos/testproject.xcodeproj/');
    vol.writeFileSync('/app/assets/notificationSound.wav', sound);
    vol.writeFileSync('/app/ios/testproject.xcodeproj/project.pbxproj', pbxproj);
    vol.writeFileSync('/app/tvos/testproject.xcodeproj/project.pbxproj', pbxproj);
  });

  afterAll(() => {
    jest.unmock('fs');
    vol.reset();
  });

  it('writes the sound file into tvos, not ios', async () => {
    const project = IOSConfig.XcodeUtils.getPbxproj(projectRoot, 'tvos');
    setNotificationSounds(projectRoot, {
      sounds: ['/app/assets/notificationSound.wav'],
      project,
      projectName: 'testproject',
      platform: 'tvos',
    });

    const after = getDirFromFS(vol.toJSON(), projectRoot);
    expect(Object.keys(after)).toContain('tvos/testproject/notificationSound.wav');
    expect(Object.keys(after)).not.toContain('ios/testproject/notificationSound.wav');
  });
});
