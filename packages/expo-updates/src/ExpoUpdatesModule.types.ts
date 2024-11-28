import { NativeModule } from 'expo-modules-core';

import {
  Manifest,
  UpdateCheckResultAvailable,
  UpdateCheckResultNotAvailable,
  UpdateCheckResultRollBack,
  UpdateFetchResultRollBackToEmbedded,
  UpdateFetchResultFailure,
  UpdateFetchResultSuccess,
  UpdatesLogEntry,
  UpdatesNativeStateMachineContext,
} from './Updates.types';

export type UpdatesEvents = {
  'Expo.nativeUpdatesStateChangeEvent': (params: any) => void;
};

export type UpdatesCheckAutomaticallyNativeValue =
  | 'ALWAYS'
  | 'ERROR_RECOVERY_ONLY'
  | 'NEVER'
  | 'WIFI_ONLY';

/**
 * Common interface for all native module implementations (android, ios, web).
 *
 * @internal
 */
export interface UpdatesModuleInterface {
  isEmergencyLaunch: boolean;
  emergencyLaunchReason: string | null;
  launchDuration: number | null;
  isEmbeddedLaunch: boolean;
  isEnabled: boolean;
  isUsingEmbeddedAssets?: boolean;
  /**
   * Can be empty string
   */
  runtimeVersion: string;
  checkAutomatically: UpdatesCheckAutomaticallyNativeValue;
  /**
   * Can be empty string
   */
  channel: string;
  shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: boolean;
  updateId?: string;
  commitTime?: string;
  /**
   * @platform android
   */
  manifestString?: string;
  /**
   * @platform ios
   */
  manifest?: Manifest;
  localAssets?: Record<string, string>;

  initialContext: UpdatesNativeStateMachineContext & {
    latestManifestString?: string;
    downloadedManifestString?: string;
    lastCheckForUpdateTimeString?: string;
    rollbackString?: string;
  };

  reload: () => Promise<void>;
  checkForUpdateAsync: () => Promise<
    | UpdateCheckResultRollBack
    | (Omit<UpdateCheckResultAvailable, 'manifest'> &
        ({ manifestString: string } | { manifest: Manifest }))
    | UpdateCheckResultNotAvailable
  >;
  getExtraParamsAsync: () => Promise<Record<string, string>>;
  setExtraParamAsync: (key: string, value: string | null) => Promise<void>;
  readLogEntriesAsync: (maxAge: number) => Promise<UpdatesLogEntry[]>;
  clearLogEntriesAsync: () => Promise<void>;
  fetchUpdateAsync: () => Promise<
    | (Omit<UpdateFetchResultSuccess, 'manifest'> &
        ({ manifestString: string } | { manifest: Manifest }))
    | UpdateFetchResultFailure
    | UpdateFetchResultRollBackToEmbedded
  >;
}

/**
 * @internal
 */
export declare class ExpoUpdatesModule
  extends NativeModule<UpdatesEvents>
  implements UpdatesModuleInterface
{
  isEmergencyLaunch: boolean;
  emergencyLaunchReason: string | null;
  launchDuration: number | null;
  isEmbeddedLaunch: boolean;
  isEnabled: boolean;
  isUsingEmbeddedAssets?: boolean;
  runtimeVersion: string;
  checkAutomatically: UpdatesCheckAutomaticallyNativeValue;
  channel: string;
  shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: boolean;
  updateId?: string;
  commitTime?: string;
  manifestString?: string;
  manifest?: Manifest;
  localAssets?: Record<string, string>;

  initialContext: UpdatesNativeStateMachineContext & {
    latestManifestString?: string;
    downloadedManifestString?: string;
    lastCheckForUpdateTimeString?: string;
    rollbackString?: string;
  };

  reload: () => Promise<void>;
  checkForUpdateAsync: () => Promise<
    | UpdateCheckResultRollBack
    | (Omit<UpdateCheckResultAvailable, 'manifest'> &
        ({ manifestString: string } | { manifest: Manifest }))
    | UpdateCheckResultNotAvailable
  >;
  getExtraParamsAsync: () => Promise<Record<string, string>>;
  setExtraParamAsync: (key: string, value: string | null) => Promise<void>;
  readLogEntriesAsync: (maxAge: number) => Promise<UpdatesLogEntry[]>;
  clearLogEntriesAsync: () => Promise<void>;
  fetchUpdateAsync: () => Promise<
    | (Omit<UpdateFetchResultSuccess, 'manifest'> &
        ({ manifestString: string } | { manifest: Manifest }))
    | UpdateFetchResultFailure
    | UpdateFetchResultRollBackToEmbedded
  >;
}
