// @docsMissing
export var AndroidOutputFormat;
(function (AndroidOutputFormat) {
    AndroidOutputFormat[AndroidOutputFormat["DEFAULT"] = 0] = "DEFAULT";
    AndroidOutputFormat[AndroidOutputFormat["THREE_GPP"] = 1] = "THREE_GPP";
    AndroidOutputFormat[AndroidOutputFormat["MPEG_4"] = 2] = "MPEG_4";
    AndroidOutputFormat[AndroidOutputFormat["AMR_NB"] = 3] = "AMR_NB";
    AndroidOutputFormat[AndroidOutputFormat["AMR_WB"] = 4] = "AMR_WB";
    AndroidOutputFormat[AndroidOutputFormat["AAC_ADIF"] = 5] = "AAC_ADIF";
    AndroidOutputFormat[AndroidOutputFormat["AAC_ADTS"] = 6] = "AAC_ADTS";
    AndroidOutputFormat[AndroidOutputFormat["RTP_AVP"] = 7] = "RTP_AVP";
    AndroidOutputFormat[AndroidOutputFormat["MPEG2TS"] = 8] = "MPEG2TS";
    AndroidOutputFormat[AndroidOutputFormat["WEBM"] = 9] = "WEBM";
})(AndroidOutputFormat || (AndroidOutputFormat = {}));
// @docsMissing
export var AndroidAudioEncoder;
(function (AndroidAudioEncoder) {
    AndroidAudioEncoder[AndroidAudioEncoder["DEFAULT"] = 0] = "DEFAULT";
    AndroidAudioEncoder[AndroidAudioEncoder["AMR_NB"] = 1] = "AMR_NB";
    AndroidAudioEncoder[AndroidAudioEncoder["AMR_WB"] = 2] = "AMR_WB";
    AndroidAudioEncoder[AndroidAudioEncoder["AAC"] = 3] = "AAC";
    AndroidAudioEncoder[AndroidAudioEncoder["HE_AAC"] = 4] = "HE_AAC";
    AndroidAudioEncoder[AndroidAudioEncoder["AAC_ELD"] = 5] = "AAC_ELD";
})(AndroidAudioEncoder || (AndroidAudioEncoder = {}));
// @docsMissing
/**
 * > **Note** Not all of the iOS formats included in this list of constants are currently supported by iOS,
 * > in spite of appearing in the Apple source code. For an accurate list of formats supported by iOS, see
 * > [Core Audio Codecs](https://developer.apple.com/library/content/documentation/MusicAudio/Conceptual/CoreAudioOverview/CoreAudioEssentials/CoreAudioEssentials.html)
 * > and [iPhone Audio File Formats](https://developer.apple.com/library/content/documentation/MusicAudio/Conceptual/CoreAudioOverview/CoreAudioEssentials/CoreAudioEssentials.html).
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
// @docsMissing
export var IOSAudioQuality;
(function (IOSAudioQuality) {
    IOSAudioQuality[IOSAudioQuality["MIN"] = 0] = "MIN";
    IOSAudioQuality[IOSAudioQuality["LOW"] = 32] = "LOW";
    IOSAudioQuality[IOSAudioQuality["MEDIUM"] = 64] = "MEDIUM";
    IOSAudioQuality[IOSAudioQuality["HIGH"] = 96] = "HIGH";
    IOSAudioQuality[IOSAudioQuality["MAX"] = 127] = "MAX";
})(IOSAudioQuality || (IOSAudioQuality = {}));
// @docsMissing
export var IOSBitRateStrategy;
(function (IOSBitRateStrategy) {
    IOSBitRateStrategy[IOSBitRateStrategy["CONSTANT"] = 0] = "CONSTANT";
    IOSBitRateStrategy[IOSBitRateStrategy["LONG_TERM_AVERAGE"] = 1] = "LONG_TERM_AVERAGE";
    IOSBitRateStrategy[IOSBitRateStrategy["VARIABLE_CONSTRAINED"] = 2] = "VARIABLE_CONSTRAINED";
    IOSBitRateStrategy[IOSBitRateStrategy["VARIABLE"] = 3] = "VARIABLE";
})(IOSBitRateStrategy || (IOSBitRateStrategy = {}));
// TODO : maybe make presets for music and speech, or lossy / lossless.
const HIGH_QUALITY = {
    isMeteringEnabled: true,
    android: {
        extension: '.m4a',
        outputFormat: AndroidOutputFormat.MPEG_4,
        audioEncoder: AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
    },
    ios: {
        extension: '.m4a',
        outputFormat: IOSOutputFormat.MPEG4AAC,
        audioQuality: IOSAudioQuality.MAX,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
    },
    web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
    },
};
const LOW_QUALITY = {
    isMeteringEnabled: true,
    android: {
        extension: '.3gp',
        outputFormat: AndroidOutputFormat.THREE_GPP,
        audioEncoder: AndroidAudioEncoder.AMR_NB,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
    },
    ios: {
        extension: '.m4a',
        audioQuality: IOSAudioQuality.MIN,
        outputFormat: IOSOutputFormat.MPEG4AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 64000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
    },
    web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
    },
};
/**
 * Constant which contains definitions of the two preset examples of `RecordingOptions`, as implemented in the Audio SDK.
 *
 * # `HIGH_QUALITY`
 * ```ts
 * RecordingOptionsPresets.HIGH_QUALITY = {
 *   isMeteringEnabled: true,
 *   android: {
 *     extension: '.m4a',
 *     outputFormat: AndroidOutputFormat.MPEG_4,
 *     audioEncoder: AndroidAudioEncoder.AAC,
 *     sampleRate: 44100,
 *     numberOfChannels: 2,
 *     bitRate: 128000,
 *   },
 *   ios: {
 *     extension: '.m4a',
 *     outputFormat: IOSOutputFormat.MPEG4AAC,
 *     audioQuality: IOSAudioQuality.MAX,
 *     sampleRate: 44100,
 *     numberOfChannels: 2,
 *     bitRate: 128000,
 *     linearPCMBitDepth: 16,
 *     linearPCMIsBigEndian: false,
 *     linearPCMIsFloat: false,
 *   },
 *   web: {
 *     mimeType: 'audio/webm',
 *     bitsPerSecond: 128000,
 *   },
 * };
 * ```
 *
 * # `LOW_QUALITY`
 * ```ts
 * RecordingOptionsPresets.LOW_QUALITY = {
 *   isMeteringEnabled: true,
 *   android: {
 *     extension: '.3gp',
 *     outputFormat: AndroidOutputFormat.THREE_GPP,
 *     audioEncoder: AndroidAudioEncoder.AMR_NB,
 *     sampleRate: 44100,
 *     numberOfChannels: 2,
 *     bitRate: 128000,
 *   },
 *   ios: {
 *     extension: '.caf',
 *     audioQuality: IOSAudioQuality.MIN,
 *     sampleRate: 44100,
 *     numberOfChannels: 2,
 *     bitRate: 128000,
 *     linearPCMBitDepth: 16,
 *     linearPCMIsBigEndian: false,
 *     linearPCMIsFloat: false,
 *   },
 *   web: {
 *     mimeType: 'audio/webm',
 *     bitsPerSecond: 128000,
 *   },
 * };
 * ```
 */
export const RecordingOptionsPresets = {
    HIGH_QUALITY,
    LOW_QUALITY,
};
//# sourceMappingURL=RecordingConstants.js.map