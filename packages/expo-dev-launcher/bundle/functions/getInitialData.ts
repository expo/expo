import {
  getBuildInfoAsync,
  getCrashReport,
  installationID,
  isDevice,
  updatesConfig,
  loadFontsAsync,
  consumeNavigationStateAsync,
} from '../native-modules/DevLauncherInternal';
import { getMenuPreferencesAsync } from '../native-modules/DevMenuPreferences';
import { AppProvidersProps } from '../providers/AppProviders';
import { defaultQueryOptions } from '../providers/QueryProvider';
import { prefetchBranchesForApp } from '../queries/useBranchesForApp';
import { getDevSessionsAsync } from './getDevSessionsAsync';
import { restoreUserAsync } from './restoreUserAsync';

export async function getInitialData(): Promise<Partial<AppProvidersProps>> {
  const [initialBuildInfo, initialDevMenuPreferences, initialCrashReport, initialNavigationState] =
    await Promise.all([
      getBuildInfoAsync(),
      getMenuPreferencesAsync(),
      getCrashReport(),
      consumeNavigationStateAsync(),
    ]);

  // todo - move this to native entirely? no need to run on app mount
  await loadFontsAsync();

  const initialUserData = await restoreUserAsync().catch((error) => {
    // likely network request failure -- no need to do anything
    console.log({ error });
    return Promise.resolve(null);
  });

  const isAuthenticated = initialUserData != null;

  const initialDevSessions = await getDevSessionsAsync({
    isAuthenticated,
    installationID,
    isDevice,
    timeout: 1500,
  }).catch((error) => {
    // likely network request failure -- no need to do anything
    console.log({ error });
    return Promise.resolve([]);
  });

  if (isAuthenticated && updatesConfig.usesEASUpdates) {
    prefetchBranchesForApp(
      updatesConfig.appId,
      updatesConfig.runtimeVersion,
      defaultQueryOptions.pageSize
    ).catch((error) => {
      // this is an optimistic fetch - not necessary to show the user anything if this fails
      console.log({ error });
    });
  }

  return {
    initialDevSessions,
    initialUserData,
    initialBuildInfo,
    initialDevMenuPreferences,
    initialCrashReport,
    initialNavigationState,
  };
}
