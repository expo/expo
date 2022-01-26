export declare type RecordingStatus = {
    canRecord: boolean;
    isRecording: boolean;
    isDoneRecording: boolean;
    durationMillis: number;
    metering?: number;
    uri?: string | null;
    mediaServicesDidReset?: boolean;
};
export declare type RecordingOptions = {
    isMeteringEnabled?: boolean;
    keepAudioActiveHint?: boolean;
    android: {
        extension: string;
        outputFormat: number;
        audioEncoder: number;
        sampleRate?: number;
        numberOfChannels?: number;
        bitRate?: number;
        maxFileSize?: number;
    };
    ios: {
        extension: string;
        outputFormat?: string | number;
        audioQuality: number;
        sampleRate: number;
        numberOfChannels: number;
        bitRate: number;
        bitRateStrategy?: number;
        bitDepthHint?: number;
        linearPCMBitDepth?: number;
        linearPCMIsBigEndian?: boolean;
        linearPCMIsFloat?: boolean;
    };
    web: {
        mimeType?: string;
        bitsPerSecond?: number;
    };
};
export declare type RecordingInput = {
    name: string;
    type: string;
    uid: string;
};
//# sourceMappingURL=Recording.types.d.ts.map