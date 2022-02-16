import { AppleDeviceManager } from '../AppleDeviceManager';
import spawnAsync from '@expo/spawn-async';

function createDeviceManager() {
  return new AppleDeviceManager({
    name: 'iPhone X',
    udid: '123',
    osType: 'iOS',
    dataPath:
      '/Users/name/Library/Developer/CoreSimulator/Devices/00E55DC0-0364-49DF-9EC6-77BE587137D4/data',
    deviceTypeIdentifier: 'com.apple.CoreSimulator.SimDeviceType.Apple-TV-1080p',
    logPath: '/Users/name/Library/Logs/CoreSimulator/00E55DC0-0364-49DF-9EC6-77BE587137D4',
    isAvailable: true,
    runtime: 'com.apple.CoreSimulator.SimRuntime.tvOS-13-4',
    osVersion: '13.4',
    state: 'Shutdown',
    windowName: 'iPhone 11 (13.6)',
  });
}

jest.mock(`@expo/spawn-async`);

import { execAsync } from '@expo/osascript';

import { simctlAsync } from '../../../platforms/ios/simctl';

const asMock = (fn: any): jest.Mock => fn;

jest.mock(`../../../../log`);

jest.mock('../../../platforms/ios/simctl', () => {
  return {
    simctlAsync: jest.fn(),
  };
});

jest.mock(`@expo/osascript`);

beforeEach(() => {
  jest.mock('../../../../utils/prompts').resetAllMocks();
  jest.mock('@expo/osascript').resetAllMocks();
  jest.mock('../../../platforms/ios/simctl').resetAllMocks();
});

describe('activateWindowAsync', () => {
  it('should activate the window', async () => {
    await createDeviceManager().activateWindowAsync();
  });
});
