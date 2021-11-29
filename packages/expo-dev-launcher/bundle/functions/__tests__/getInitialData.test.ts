import { getAppInfoAsync } from '../../native-modules/DevLauncherInternal';
import { getSettingsAsync } from '../../native-modules/DevMenuInternal';
import { getInitialData } from '../getInitialData';
import { getLocalPackagersAsync } from '../getLocalPackagersAsync';
import { restoreUserAsync } from '../restoreUserAsync';

jest.mock('../getLocalPackagersAsync');
jest.mock('../restoreUserAsync');

describe('getInitialData()', () => {
  test('calls all the fns we need', async () => {
    expect(getLocalPackagersAsync).not.toHaveBeenCalled();
    expect(getAppInfoAsync).not.toHaveBeenCalled();
    expect(getSettingsAsync).not.toHaveBeenCalled();
    expect(restoreUserAsync).not.toHaveBeenCalled();

    await getInitialData();

    expect(getLocalPackagersAsync).toHaveBeenCalled();
    expect(getAppInfoAsync).toHaveBeenCalled();
    expect(getSettingsAsync).toHaveBeenCalled();
    expect(restoreUserAsync).toHaveBeenCalled();
  });
});
