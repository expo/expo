import { Platform } from 'expo';

import {
  getExactAlarmPermissionsAsync,
  requestExactAlarmPermissionsAsync,
} from '../NotificationPermissions';
import NotificationPermissionsModule from '../NotificationPermissionsModule';

jest.mock('../NotificationPermissionsModule', () => ({
  __esModule: true,
  default: {
    getExactAlarmPermissionsAsync: jest.fn(),
    requestExactAlarmPermissionsAsync: jest.fn(),
  },
}));

const mockModule = NotificationPermissionsModule as jest.Mocked<
  Required<typeof NotificationPermissionsModule>
>;

const grantedResponse = {
  status: 'granted',
  granted: true,
  canAskAgain: true,
  expires: 'never',
};

const deniedResponse = {
  status: 'denied',
  granted: false,
  canAskAgain: true,
  expires: 'never',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on iOS', () => {
  it.each([
    ['getExactAlarmPermissionsAsync', getExactAlarmPermissionsAsync],
    ['requestExactAlarmPermissionsAsync', requestExactAlarmPermissionsAsync],
  ] as const)('%s resolves granted without calling the native module', async (name, fn) => {
    await expect(fn()).resolves.toEqual(grantedResponse);
    expect(mockModule[name]).not.toHaveBeenCalled();
  });
});

describe('on Android', () => {
  const originalOS = Platform.OS;

  beforeAll(() => {
    Platform.OS = 'android';
  });

  afterAll(() => {
    Platform.OS = originalOS;
  });

  it('getExactAlarmPermissionsAsync delegates to the native module', async () => {
    mockModule.getExactAlarmPermissionsAsync.mockResolvedValue(deniedResponse as any);
    await expect(getExactAlarmPermissionsAsync()).resolves.toEqual(deniedResponse);
    expect(mockModule.getExactAlarmPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('requestExactAlarmPermissionsAsync delegates to the native module', async () => {
    mockModule.requestExactAlarmPermissionsAsync.mockResolvedValue(grantedResponse as any);
    await expect(requestExactAlarmPermissionsAsync()).resolves.toEqual(grantedResponse);
    expect(mockModule.requestExactAlarmPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});
