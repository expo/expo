import { IOSOutputFormat, AudioQuality } from './Audio.types';
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
export const RecordingPresets = {
    HIGH_QUALITY,
    LOW_QUALITY,
};
//# sourceMappingURL=RecordingConstants.js.map