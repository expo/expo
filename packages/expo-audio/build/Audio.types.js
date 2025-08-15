/**
 * Audio output format options for iOS recording.
 *
 * Comprehensive enum of audio formats supported by iOS for recording.
 * Each format has different characteristics in terms of quality, file size, and compatibility.
 * Some formats like LINEARPCM offer the highest quality but larger file sizes,
 * while compressed formats like AAC provide good quality with smaller files.
 *
 * @platform ios
 */
export var IOSOutputFormat;
(function (IOSOutputFormat) {
    IOSOutputFormat["LINEARPCM"] = "lpcm";
    IOSOutputFormat["AC3"] = "ac-3";
    IOSOutputFormat["60958AC3"] = "cac3";
    IOSOutputFormat["APPLEIMA4"] = "ima4";
    IOSOutputFormat["MPEG4AAC"] = "aac ";
    IOSOutputFormat["MPEG4CELP"] = "celp";
    IOSOutputFormat["MPEG4HVXC"] = "hvxc";
    IOSOutputFormat["MPEG4TWINVQ"] = "twvq";
    IOSOutputFormat["MACE3"] = "MAC3";
    IOSOutputFormat["MACE6"] = "MAC6";
    IOSOutputFormat["ULAW"] = "ulaw";
    IOSOutputFormat["ALAW"] = "alaw";
    IOSOutputFormat["QDESIGN"] = "QDMC";
    IOSOutputFormat["QDESIGN2"] = "QDM2";
    IOSOutputFormat["QUALCOMM"] = "Qclp";
    IOSOutputFormat["MPEGLAYER1"] = ".mp1";
    IOSOutputFormat["MPEGLAYER2"] = ".mp2";
    IOSOutputFormat["MPEGLAYER3"] = ".mp3";
    IOSOutputFormat["APPLELOSSLESS"] = "alac";
    IOSOutputFormat["MPEG4AAC_HE"] = "aach";
    IOSOutputFormat["MPEG4AAC_LD"] = "aacl";
    IOSOutputFormat["MPEG4AAC_ELD"] = "aace";
    IOSOutputFormat["MPEG4AAC_ELD_SBR"] = "aacf";
    IOSOutputFormat["MPEG4AAC_ELD_V2"] = "aacg";
    IOSOutputFormat["MPEG4AAC_HE_V2"] = "aacp";
    IOSOutputFormat["MPEG4AAC_SPATIAL"] = "aacs";
    IOSOutputFormat["AMR"] = "samr";
    IOSOutputFormat["AMR_WB"] = "sawb";
    IOSOutputFormat["AUDIBLE"] = "AUDB";
    IOSOutputFormat["ILBC"] = "ilbc";
    IOSOutputFormat[IOSOutputFormat["DVIINTELIMA"] = 1836253201] = "DVIINTELIMA";
    IOSOutputFormat[IOSOutputFormat["MICROSOFTGSM"] = 1836253233] = "MICROSOFTGSM";
    IOSOutputFormat["AES3"] = "aes3";
    IOSOutputFormat["ENHANCEDAC3"] = "ec-3";
})(IOSOutputFormat || (IOSOutputFormat = {}));
/**
 * Audio quality levels for recording.
 *
 * Predefined quality levels that balance file size and audio fidelity.
 * Higher quality levels produce better sound but larger files and require more processing power.
 */
export var AudioQuality;
(function (AudioQuality) {
    /** Minimum quality: smallest file size, lowest fidelity. */
    AudioQuality[AudioQuality["MIN"] = 0] = "MIN";
    /** Low quality: good for voice recordings where file size matters. */
    AudioQuality[AudioQuality["LOW"] = 32] = "LOW";
    /** Medium quality: balanced option for most use cases. */
    AudioQuality[AudioQuality["MEDIUM"] = 64] = "MEDIUM";
    /** High quality: good fidelity, larger file size. */
    AudioQuality[AudioQuality["HIGH"] = 96] = "HIGH";
    /** Maximum quality: best fidelity, largest file size. */
    AudioQuality[AudioQuality["MAX"] = 127] = "MAX";
})(AudioQuality || (AudioQuality = {}));
//# sourceMappingURL=Audio.types.js.map