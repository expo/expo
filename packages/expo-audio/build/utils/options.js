import { Platform } from 'expo-modules-core';
export function createRecordingOptions(options) {
    const commonOptions = {
        extension: options.extension,
        sampleRate: options.sampleRate,
        numberOfChannels: options.numberOfChannels,
        bitRate: options.bitRate,
        isMeteringEnabled: options.isMeteringEnabled ?? false,
    };
    if (Platform.OS === 'ios') {
        return {
            ...commonOptions,
            ...options.ios,
        };
    }
    else if (Platform.OS === 'android') {
        return {
            ...commonOptions,
            ...options.android,
        };
    }
    else {
        return {
            ...commonOptions,
            ...options.web,
        };
    }
}
//# sourceMappingURL=options.js.map