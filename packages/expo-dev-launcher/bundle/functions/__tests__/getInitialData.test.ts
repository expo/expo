import { getBuildInfoAsync } from '../../native-modules/DevLauncherInternal';
import { queryDevSessionsAsync } from '../../native-modules/DevMenu';
import { getSettingsAsync } from '../../native-modules/DevMenuInternal';
import { getInitialData } from '../getInitialData';
import { restoreUserAsync } from '../restoreUserAsync';

// jest.mock('../getDevSessionsAsync');
jest.mock('../restoreUserAsync');

const mockRestoreUserAsync = restoreUserAsync as jest.Mock;

const mockFns = [getBuildInfoAsync, getSettingsAsync, restoreUserAsync] as jest.Mock[];

describe('getInitialData()', () => {
  beforeEach(() => {
    mockFns.forEach((fn) => fn.mockReset());
  });

  test('calls all the fns we need', async () => {
    expect(getBuildInfoAsync).not.toHaveBeenCalled();
    expect(getSettingsAsync).not.toHaveBeenCalled();
    expect(restoreUserAsync).not.toHaveBeenCalled();

    await getInitialData();

    // not called unless user is authenticated
    expect(queryDevSessionsAsync).not.toHaveBeenCalled();
    expect(getBuildInfoAsync).toHaveBeenCalled();
    expect(getSettingsAsync).toHaveBeenCalled();
    expect(restoreUserAsync).toHaveBeenCalled();
  });

  test('queries dev sessions if logged in', async () => {
    mockRestoreUserAsync.mockResolvedValueOnce({ username: '123' });

    expect(getBuildInfoAsync).not.toHaveBeenCalled();
    expect(getSettingsAsync).not.toHaveBeenCalled();
    expect(restoreUserAsync).not.toHaveBeenCalled();
    expect(queryDevSessionsAsync).not.toHaveBeenCalled();

    await getInitialData();

    expect(queryDevSessionsAsync).toHaveBeenCalled();
    expect(getBuildInfoAsync).toHaveBeenCalled();
    expect(getSettingsAsync).toHaveBeenCalled();
    expect(restoreUserAsync).toHaveBeenCalled();
  });
});
