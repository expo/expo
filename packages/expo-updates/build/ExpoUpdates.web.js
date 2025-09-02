import { NativeModule, registerWebModule } from 'expo-modules-core';
import { UpdateCheckResultNotAvailableReason, } from './Updates.types';
class ExpoUpdatesModule extends NativeModule {
    isEmergencyLaunch = false;
    emergencyLaunchReason = null;
    launchDuration = null;
    isEmbeddedLaunch = false;
    isEnabled = true;
    isUsingEmbeddedAssets = undefined;
    runtimeVersion = '';
    checkAutomatically = 'ALWAYS';
    channel = '';
    shouldDeferToNativeForAPIMethodAvailabilityInDevelopment = false;
    updateId;
    commitTime;
    manifestString;
    manifest;
    localAssets;
    initialContext = {
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
    async reload() {
        if (typeof window !== 'undefined')
            window.location.reload(true);
    }
    async checkForUpdateAsync() {
        return {
            isAvailable: false,
            manifest: undefined,
            isRollBackToEmbedded: false,
            reason: UpdateCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER,
        };
    }
    async getExtraParamsAsync() {
        return {};
    }
    async setExtraParamAsync(key, value) { }
    async readLogEntriesAsync(maxAge) {
        return [];
    }
    async clearLogEntriesAsync() { }
    async fetchUpdateAsync() {
        return { isNew: false, manifest: undefined, isRollBackToEmbedded: false };
    }
}
export default registerWebModule(ExpoUpdatesModule, 'ExpoUpdates');
//# sourceMappingURL=ExpoUpdates.web.js.map