import {
  consumeNavigationStateAsync,
  getBuildInfoAsync,
  getCrashReport,
  installationID,
} from '../../native-modules/DevLauncherInternal';
import { getMenuPreferencesAsync } from '../../native-modules/DevMenuPreferences';
import { getDevSessionsAsync } from '../getDevSessionsAsync';
import { getInitialData } from '../getInitialData';
import { restoreUserAsync } from '../restoreUserAsync';

jest.mock('../restoreUserAsync', () => {
  return {
    restoreUserAsync: jest.fn().mockResolvedValue(null),
  };
});
jest.mock('../getDevSessionsAsync', () => {
  return {
    getDevSessionsAsync: jest.fn().mockResolvedValue([]),
  };
});

const mockRestoreUserAsync = restoreUserAsync as jest.Mock;

const mockFns = [
  getBuildInfoAsync,
  getMenuPreferencesAsync,
  restoreUserAsync,
  getDevSessionsAsync,
  getCrashReport,
  consumeNavigationStateAsync,
] as jest.Mock[];

describe('getInitialData()', () => {
  beforeEach(() => {
    mockFns.forEach((fn) => fn.mockClear());
  });

  test('calls all the fns we need', async () => {
    expect(getBuildInfoAsync).not.toHaveBeenCalled();
    expect(getMenuPreferencesAsync).not.toHaveBeenCalled();
    expect(restoreUserAsync).not.toHaveBeenCalled();
    expect(getDevSessionsAsync).not.toHaveBeenCalled();
    expect(getCrashReport).not.toHaveBeenCalled();
    expect(consumeNavigationStateAsync).not.toHaveBeenCalled();

    await getInitialData();

    expect(getDevSessionsAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ isAuthenticated: false })
    );

    expect(getDevSessionsAsync).toHaveBeenCalled();
    expect(getBuildInfoAsync).toHaveBeenCalled();
    expect(getMenuPreferencesAsync).toHaveBeenCalled();
    expect(restoreUserAsync).toHaveBeenCalled();
    expect(getCrashReport).toHaveBeenCalled();
    expect(consumeNavigationStateAsync).toHaveBeenCalled();
  });

  test('queries dev sessions if logged in', async () => {
    mockRestoreUserAsync.mockResolvedValueOnce({ username: '123' });
    expect(getBuildInfoAsync).not.toHaveBeenCalled();
    expect(getMenuPreferencesAsync).not.toHaveBeenCalled();
    expect(restoreUserAsync).not.toHaveBeenCalled();
    expect(getDevSessionsAsync).not.toHaveBeenCalled();
    expect(getCrashReport).not.toHaveBeenCalled();

    await getInitialData();

    expect(getDevSessionsAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ isAuthenticated: true, installationID })
    );

    expect(getBuildInfoAsync).toHaveBeenCalled();
    expect(getMenuPreferencesAsync).toHaveBeenCalled();
    expect(restoreUserAsync).toHaveBeenCalled();
    expect(getCrashReport).toHaveBeenCalled();
  });
});
