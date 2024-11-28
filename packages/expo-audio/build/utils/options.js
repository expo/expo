import { Platform } from 'expo-modules-core';
export function createRecordingOptions(options) {
    let commonOptions = {
        extension: options.extension,
        sampleRate: options.sampleRate,
        numberOfChannels: options.numberOfChannels,
        bitRate: options.bitRate,
    };
    if (Platform.OS === 'ios') {
        commonOptions = {
            ...commonOptions,
            ...options.ios,
        };
    }
    else if (Platform.OS === 'android') {
        commonOptions = {
            ...commonOptions,
            ...options.android,
        };
    }
    return commonOptions;
}
//# sourceMappingURL=options.js.map