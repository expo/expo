import { AppProvidersProps } from '../components/redesign/AppProviders';
import { getAppInfoAsync } from '../native-modules/DevLauncherInternal';
import { getSettingsAsync } from '../native-modules/DevMenuInternal';
import { getLocalPackagersAsync } from './getLocalPackagersAsync';
import { restoreUserAsync } from './restoreUserAsync';

export async function getInitialData(): Promise<Partial<AppProvidersProps>> {
  const initialPackagers = await getLocalPackagersAsync();
  const initialUserData = await restoreUserAsync();
  const initialAppInfo = await getAppInfoAsync();
  const initialDevMenuSettings = await getSettingsAsync();

  return {
    initialPackagers,
    initialUserData,
    initialAppInfo,
    initialDevMenuSettings,
  };
}
