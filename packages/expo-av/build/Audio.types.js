// @needsAudit
/**
 * @platform ios
 */
export var InterruptionModeIOS;
(function (InterruptionModeIOS) {
    /**
     * **This is the default option.** If this option is set, your experience's audio is mixed with audio playing in background apps.
     */
    InterruptionModeIOS[InterruptionModeIOS["MixWithOthers"] = 0] = "MixWithOthers";
    /**
     * If this option is set, your experience's audio interrupts audio from other apps.
     */
    InterruptionModeIOS[InterruptionModeIOS["DoNotMix"] = 1] = "DoNotMix";
    /**
     * If this option is set, your experience's audio lowers the volume ("ducks") of audio from other apps while your audio plays.
     */
    InterruptionModeIOS[InterruptionModeIOS["DuckOthers"] = 2] = "DuckOthers";
})(InterruptionModeIOS || (InterruptionModeIOS = {}));
/**
 * @platform android
 */
export var InterruptionModeAndroid;
(function (InterruptionModeAndroid) {
    /**
     * If this option is set, your experience's audio interrupts audio from other apps.
     */
    InterruptionModeAndroid[InterruptionModeAndroid["DoNotMix"] = 1] = "DoNotMix";
    /**
     * **This is the default option.** If this option is set, your experience's audio lowers the volume ("ducks") of audio from other apps while your audio plays.
     */
    InterruptionModeAndroid[InterruptionModeAndroid["DuckOthers"] = 2] = "DuckOthers";
})(InterruptionModeAndroid || (InterruptionModeAndroid = {}));
//# sourceMappingURL=Audio.types.js.map