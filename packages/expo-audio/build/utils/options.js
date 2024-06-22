import { Platform } from 'expo-modules-core';
export function createRecordingOptions(options) {
    let newOptions = {
        extension: options.extension,
        sampleRate: options.sampleRate,
        numberOfChannels: options.numberOfChannels,
        bitRate: options.bitRate,
    };
    if (Platform.OS === 'ios') {
        newOptions = {
            ...newOptions,
            ...options.ios,
        };
    }
    else if (Platform.OS === 'android') {
        newOptions = {
            ...newOptions,
            ...options.android,
        };
    }
    return newOptions;
}
//# sourceMappingURL=options.js.map