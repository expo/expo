import { AppProvidersProps } from '../components/AppProviders';
import { getBuildInfoAsync, installationID, isDevice } from '../native-modules/DevLauncherInternal';
import { getSettingsAsync } from '../native-modules/DevMenuInternal';
import { getDevSessionsAsync } from './getDevSessionsAsync';
import { restoreUserAsync } from './restoreUserAsync';

export async function getInitialData(): Promise<Partial<AppProvidersProps>> {
  const initialUserData = await restoreUserAsync();
  const isAuthenticated = initialUserData != null;

  const initialDevSessions = await getDevSessionsAsync({
    isAuthenticated,
    installationID,
    isDevice,
  });

  const initialBuildInfo = await getBuildInfoAsync();
  const initialDevMenuSettings = await getSettingsAsync();

  return {
    initialDevSessions,
    initialUserData,
    initialBuildInfo,
    initialDevMenuSettings,
  };
}
