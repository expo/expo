import plist from '@expo/plist';
import { vol } from 'memfs';

import { syncConfigurationToNativeAsync } from '../syncConfigurationToNativeAsync';

jest.mock('fs');
jest.mock('node:fs', () => require('memfs').fs);
jest.mock('expo/config', () => ({
  getConfig: jest.fn(() => ({
    exp: {
      name: 'testproject',
      slug: 'testproject',
      updates: { url: 'https://u.expo.dev/test', enabled: true },
      runtimeVersion: '1.0.0',
    },
  })),
}));

const projectRoot = '/app';

/** Both Apple projects exist, as they do after prebuilding for ios and tvos. */
function mockAppleProjects() {
  vol.fromJSON(
    {
      'ios/testproject/AppDelegate.swift': '',
      'ios/testproject.xcodeproj/project.pbxproj': '',
      'ios/testproject/Supporting/Expo.plist': plist.build({}),
      'tvos/testproject/AppDelegate.swift': '',
      'tvos/testproject.xcodeproj/project.pbxproj': '',
      'tvos/testproject/Supporting/Expo.plist': plist.build({}),
    },
    projectRoot
  );
}

function readExpoPlist(platform: 'ios' | 'tvos'): Record<string, any> {
  return plist.parse(
    vol.readFileSync(
      `${projectRoot}/${platform}/testproject/Supporting/Expo.plist`,
      'utf8'
    ) as string
  );
}

describe('configuration:syncnative', () => {
  afterEach(() => {
    vol.reset();
  });

  it('writes the ios Expo.plist for the ios platform', async () => {
    mockAppleProjects();

    await syncConfigurationToNativeAsync({ projectRoot, platform: 'ios', workflow: 'generic' });

    expect(readExpoPlist('ios')).toMatchObject({ EXUpdatesURL: 'https://u.expo.dev/test' });
    expect(readExpoPlist('tvos')).toEqual({});
  });

  it('writes the tvos Expo.plist for the tvos platform', async () => {
    mockAppleProjects();

    await syncConfigurationToNativeAsync({ projectRoot, platform: 'tvos', workflow: 'generic' });

    expect(readExpoPlist('tvos')).toMatchObject({ EXUpdatesURL: 'https://u.expo.dev/test' });
    expect(readExpoPlist('ios')).toEqual({});
  });

  it('does nothing for a managed project', async () => {
    mockAppleProjects();

    await syncConfigurationToNativeAsync({ projectRoot, platform: 'tvos', workflow: 'managed' });

    expect(readExpoPlist('tvos')).toEqual({});
  });
});
