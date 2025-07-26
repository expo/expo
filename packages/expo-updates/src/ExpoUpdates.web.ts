import { NativeModule, registerWebModule } from 'expo-modules-core';

import {
  UpdatesCheckAutomaticallyNativeValue,
  UpdatesEvents,
  UpdatesModuleInterface,
} from './ExpoUpdatesModule.types';
import {
  Manifest,
  UpdatesNativeStateMachineContext,
  UpdateCheckResultNotAvailable,
  UpdatesLogEntry,
  UpdateFetchResultFailure,
  UpdateCheckResultNotAvailableReason,
} from './Updates.types';

class ExpoUpdatesModule extends NativeModule<UpdatesEvents> implements UpdatesModuleInterface {
  isEmergencyLaunch: boolean = false;
  emergencyLaunchReason: string | null = null;
  launchDuration: number | null = null;
  isEmbeddedLaunch: boolean = false;
  isEnabled: boolean = true;
  isUsingEmbeddedAssets?: boolean | undefined = undefined;
  runtimeVersion: string = '';
  checkAutomatically: UpdatesCheckAutomaticallyNativeValue = 'ALWAYS';
  channel: string = '';
  shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: boolean = false;
  updateId?: string | undefined;
  commitTime?: string | undefined;
  manifestString?: string | undefined;
  manifest?: Manifest | undefined;
  localAssets?: Record<string, string> | undefined;

  initialContext: UpdatesNativeStateMachineContext & {
    latestManifestString?: string | undefined;
    downloadedManifestString?: string | undefined;
    lastCheckForUpdateTimeString?: string | undefined;
    rollbackString?: string | undefined;
  } = {
    isStartupProcedureRunning: false,
    isUpdateAvailable: false,
    isUpdatePending: false,
    isChecking: false,
    isDownloading: false,
    isRestarting: false,
    restartCount: 0,
    sequenceNumber: 0,
    downloadProgress: 0,
  };

  async reload(): Promise<void> {
    if (typeof window !== 'undefined') window.location.reload(true);
  }

  async checkForUpdateAsync(): Promise<UpdateCheckResultNotAvailable> {
    return {
      isAvailable: false,
      manifest: undefined,
      isRollBackToEmbedded: false,
      reason: UpdateCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER,
    };
  }

  async getExtraParamsAsync(): Promise<Record<string, string>> {
    return {};
  }

  async setExtraParamAsync(key: string, value: string | null): Promise<void> {}

  async readLogEntriesAsync(maxAge: number): Promise<UpdatesLogEntry[]> {
    return [];
  }

  async clearLogEntriesAsync(): Promise<void> {}

  async fetchUpdateAsync(): Promise<UpdateFetchResultFailure> {
    return { isNew: false, manifest: undefined, isRollBackToEmbedded: false };
  }
}

export default registerWebModule(ExpoUpdatesModule, 'ExpoUpdates');
