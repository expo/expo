export type AudioMode = {
    /**
     * A boolean selecting if recording is enabled on iOS.
     * > When this flag is set to `true`, playback may be routed to the phone earpiece instead of to the speaker. Set it back to `false` after stopping recording to reenable playback through the speaker.
     * @default false
     */
    allowsRecordingIOS: boolean;
    /**
     * An enum selecting how your experience's audio should interact with the audio from other apps on iOS.
     */
    interruptionModeIOS: InterruptionModeIOS;
    /**
     * A boolean selecting if your experience's audio should play in silent mode on iOS.
     * @default false
     */
    playsInSilentModeIOS: boolean;
    /**
     * A boolean selecting if the audio session (playback or recording) should stay active even when the app goes into background.
     * > This is not available in Expo Go for iOS, it will only work in standalone apps.
     * > To enable it for standalone apps, [follow the instructions below](#playing-or-recording-audio-in-background-ios)
     * > to add `UIBackgroundModes` to your app configuration.
     * @default false
     */
    staysActiveInBackground: boolean;
    /**
     * An enum selecting how your experience's audio should interact with the audio from other apps on Android.
     */
    interruptionModeAndroid: InterruptionModeAndroid;
    /**
     * A boolean selecting if your experience's audio should automatically be lowered in volume ("duck") if audio from another
     * app interrupts your experience. If `false`, audio from other apps will pause your audio.
     * @default true
     */
    shouldDuckAndroid: boolean;
    /**
     * A boolean selecting if the audio is routed to earpiece on Android.
     * @default false
     */
    playThroughEarpieceAndroid: boolean;
};
export declare enum InterruptionModeIOS {
    /**
     * **This is the default option.** If this option is set, your experience's audio is mixed with audio playing in background apps.
     */
    MixWithOthers = 0,
    /**
     * If this option is set, your experience's audio interrupts audio from other apps.
     */
    DoNotMix = 1,
    /**
     * If this option is set, your experience's audio lowers the volume ("ducks") of audio from other apps while your audio plays.
     */
    DuckOthers = 2
}
export declare enum InterruptionModeAndroid {
    /**
     * If this option is set, your experience's audio interrupts audio from other apps.
     */
    DoNotMix = 1,
    /**
     * **This is the default option.** If this option is set, your experience's audio lowers the volume ("ducks") of audio from other apps while your audio plays.
     */
    DuckOthers = 2
}
//# sourceMappingURL=Audio.types.d.ts.map