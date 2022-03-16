import {
  getBuildInfoAsync,
  getCrashReport,
  installationID,
  isDevice,
} from '../native-modules/DevLauncherInternal';
import { getSettingsAsync } from '../native-modules/DevMenuInternal';
import { AppProvidersProps } from '../providers/AppProviders';
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

  const initialCrashReport = await getCrashReport();

  return {
    initialDevSessions,
    initialUserData,
    initialBuildInfo,
    initialDevMenuSettings,
    initialCrashReport,
  };
}
