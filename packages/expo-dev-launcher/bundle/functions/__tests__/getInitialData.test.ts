import { restClient } from '../../apiClient';
import { getBuildInfoAsync, installationID } from '../../native-modules/DevLauncherInternal';
import { getSettingsAsync } from '../../native-modules/DevMenuInternal';
import { getInitialData } from '../getInitialData';
import { restoreUserAsync } from '../restoreUserAsync';

jest.mock('../restoreUserAsync');
jest.mock('../../apiClient');

const mockRestoreUserAsync = restoreUserAsync as jest.Mock;
const mockRestClient = restClient as jest.Mock;

const mockFns = [getBuildInfoAsync, getSettingsAsync, restoreUserAsync, restClient] as jest.Mock[];

describe('getInitialData()', () => {
  beforeEach(() => {
    mockFns.forEach((fn) => fn.mockReset());
  });

  test('calls all the fns we need', async () => {
    mockRestClient.mockResolvedValue({ data: [] });

    expect(getBuildInfoAsync).not.toHaveBeenCalled();
    expect(getSettingsAsync).not.toHaveBeenCalled();
    expect(restoreUserAsync).not.toHaveBeenCalled();
    expect(restClient).not.toHaveBeenCalled();

    await getInitialData();

    // not called unless user is authenticated
    expect(restClient).not.toHaveBeenCalled();
    expect(getBuildInfoAsync).toHaveBeenCalled();
    expect(getSettingsAsync).toHaveBeenCalled();
    expect(restoreUserAsync).toHaveBeenCalled();
  });

  test.only('queries dev sessions if logged in', async () => {
    mockRestoreUserAsync.mockResolvedValueOnce({ username: '123' });
    mockRestClient.mockResolvedValue({ data: [] });

    expect(getBuildInfoAsync).not.toHaveBeenCalled();
    expect(getSettingsAsync).not.toHaveBeenCalled();
    expect(restoreUserAsync).not.toHaveBeenCalled();

    await getInitialData();

    expect(restClient).toHaveBeenLastCalledWith(
      expect.stringContaining(`deviceId=${installationID}`),
      expect.any(Object)
    );

    expect(getBuildInfoAsync).toHaveBeenCalled();
    expect(getSettingsAsync).toHaveBeenCalled();
    expect(restoreUserAsync).toHaveBeenCalled();
  });
});
