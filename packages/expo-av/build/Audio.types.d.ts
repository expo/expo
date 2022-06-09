export declare type AudioMode = {
    allowsRecordingIOS: boolean;
    interruptionModeIOS: InterruptionModeIOS;
    playsInSilentModeIOS: boolean;
    staysActiveInBackground: boolean;
    interruptionModeAndroid: InterruptionModeAndroid;
    shouldDuckAndroid: boolean;
    playThroughEarpieceAndroid: boolean;
};
export declare enum InterruptionModeIOS {
    MixWithOthers = 0,
    DoNotMix = 1,
    DuckOthers = 2
}
export declare enum InterruptionModeAndroid {
    DoNotMix = 1,
    DuckOthers = 2
}
//# sourceMappingURL=Audio.types.d.ts.map