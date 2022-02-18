import {
  getBuildInfoAsync,
  getCrashReport,
  installationID,
} from '../../native-modules/DevLauncherInternal';
import { getSettingsAsync } from '../../native-modules/DevMenuInternal';
import { getDevSessionsAsync } from '../getDevSessionsAsync';
import { getInitialData } from '../getInitialData';
import { restoreUserAsync } from '../restoreUserAsync';

jest.mock('../restoreUserAsync');
jest.mock('../getDevSessionsAsync');

const mockRestoreUserAsync = restoreUserAsync as jest.Mock;

const mockFns = [
  getBuildInfoAsync,
  getSettingsAsync,
  restoreUserAsync,
  getDevSessionsAsync,
  getCrashReport,
] as jest.Mock[];

describe('getInitialData()', () => {
  beforeEach(() => {
    mockFns.forEach((fn) => fn.mockClear());
  });

  test('calls all the fns we need', async () => {
    expect(getBuildInfoAsync).not.toHaveBeenCalled();
    expect(getSettingsAsync).not.toHaveBeenCalled();
    expect(restoreUserAsync).not.toHaveBeenCalled();
    expect(getDevSessionsAsync).not.toHaveBeenCalled();
    expect(getCrashReport).not.toHaveBeenCalled();

    await getInitialData();

    expect(getDevSessionsAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ isAuthenticated: false })
    );

    expect(getDevSessionsAsync).toHaveBeenCalled();
    expect(getBuildInfoAsync).toHaveBeenCalled();
    expect(getSettingsAsync).toHaveBeenCalled();
    expect(restoreUserAsync).toHaveBeenCalled();
    expect(getCrashReport).toHaveBeenCalled();
  });

  test('queries dev sessions if logged in', async () => {
    mockRestoreUserAsync.mockResolvedValueOnce({ username: '123' });
    expect(getBuildInfoAsync).not.toHaveBeenCalled();
    expect(getSettingsAsync).not.toHaveBeenCalled();
    expect(restoreUserAsync).not.toHaveBeenCalled();
    expect(getDevSessionsAsync).not.toHaveBeenCalled();
    expect(getCrashReport).not.toHaveBeenCalled();

    await getInitialData();

    expect(getDevSessionsAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ isAuthenticated: true, installationID })
    );

    expect(getBuildInfoAsync).toHaveBeenCalled();
    expect(getSettingsAsync).toHaveBeenCalled();
    expect(restoreUserAsync).toHaveBeenCalled();
    expect(getCrashReport).toHaveBeenCalled();
  });
});
