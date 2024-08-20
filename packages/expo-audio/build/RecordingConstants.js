import { IOSOutputFormat, AudioQuality } from './Audio.types';
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
export var IOSBitRateStrategy;
(function (IOSBitRateStrategy) {
    IOSBitRateStrategy[IOSBitRateStrategy["CONSTANT"] = 0] = "CONSTANT";
    IOSBitRateStrategy[IOSBitRateStrategy["LONG_TERM_AVERAGE"] = 1] = "LONG_TERM_AVERAGE";
    IOSBitRateStrategy[IOSBitRateStrategy["VARIABLE_CONSTRAINED"] = 2] = "VARIABLE_CONSTRAINED";
    IOSBitRateStrategy[IOSBitRateStrategy["VARIABLE"] = 3] = "VARIABLE";
})(IOSBitRateStrategy || (IOSBitRateStrategy = {}));
// TODO : maybe make presets for music and speech, or lossy / lossless.
const HIGH_QUALITY = {
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    android: {
        outputFormat: 'mpeg4',
        audioEncoder: 'aac',
    },
    ios: {
        outputFormat: IOSOutputFormat.MPEG4AAC,
        audioQuality: AudioQuality.MAX,
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
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 64000,
    android: {
        extension: '.3gp',
        outputFormat: '3gp',
        audioEncoder: 'amr_nb',
        sampleRate: 44100,
    },
    ios: {
        audioQuality: AudioQuality.MIN,
        outputFormat: IOSOutputFormat.MPEG4AAC,
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