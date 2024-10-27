import ExponentAV from './ExponentAV';
// @needsAudit
/**
 * Check [official Apple documentation](https://developer.apple.com/documentation/avfoundation/audio_settings/time_pitch_algorithm_settings) for more information.
 */
export var PitchCorrectionQuality;
(function (PitchCorrectionQuality) {
    /**
     * Equivalent to `AVAudioTimePitchAlgorithmLowQualityZeroLatency`.
     */
    PitchCorrectionQuality[PitchCorrectionQuality["Low"] = ExponentAV && ExponentAV.Qualities && ExponentAV.Qualities.Low] = "Low";
    /**
     * Equivalent to `AVAudioTimePitchAlgorithmTimeDomain`.
     */
    PitchCorrectionQuality[PitchCorrectionQuality["Medium"] = ExponentAV && ExponentAV.Qualities && ExponentAV.Qualities.Medium] = "Medium";
    /**
     * Equivalent to `AVAudioTimePitchAlgorithmSpectral`.
     */
    PitchCorrectionQuality[PitchCorrectionQuality["High"] = ExponentAV && ExponentAV.Qualities && ExponentAV.Qualities.High] = "High";
})(PitchCorrectionQuality || (PitchCorrectionQuality = {}));
//# sourceMappingURL=AV.types.js.map