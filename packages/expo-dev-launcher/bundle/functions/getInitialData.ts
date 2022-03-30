import { NativeModules } from 'react-native';
import {
  getBuildInfoAsync,
  getCrashReport,
  installationID,
  isDevice,
  updatesConfig,
} from '../native-modules/DevLauncherInternal';
import { getMenuPreferencesAsync } from '../native-modules/DevMenuPreferences';
import { AppProvidersProps } from '../providers/AppProviders';
import { prefetchBranchesForApp } from '../queries/useBranchesForApp';
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
  const initialDevMenuPreferences = await getMenuPreferencesAsync();
  const initialCrashReport = await getCrashReport();

  if (isAuthenticated && updatesConfig.usesEASUpdates) {
    prefetchBranchesForApp(updatesConfig.appId, updatesConfig.runtimeVersion).catch((error) =>
      console.log({ error })
    );
  }

  return {
    initialDevSessions,
    initialUserData,
    initialBuildInfo,
    initialDevMenuPreferences,
    initialCrashReport,
  };
}
