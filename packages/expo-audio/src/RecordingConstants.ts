import { IOSOutputFormat, type RecordingOptions, AudioQuality } from './Audio.types';

// @docsMissing
export enum AndroidOutputFormat {
  DEFAULT = 0,
  THREE_GPP = 1,
  MPEG_4 = 2,
  AMR_NB = 3,
  AMR_WB = 4,
  AAC_ADIF = 5,
  AAC_ADTS = 6,
  RTP_AVP = 7,
  MPEG2TS = 8,
  WEBM = 9,
}

// @docsMissing
export enum AndroidAudioEncoder {
  DEFAULT = 0,
  AMR_NB = 1,
  AMR_WB = 2,
  AAC = 3,
  HE_AAC = 4,
  AAC_ELD = 5,
}

// @docsMissing
export enum IOSBitRateStrategy {
  CONSTANT = 0,
  LONG_TERM_AVERAGE = 1,
  VARIABLE_CONSTRAINED = 2,
  VARIABLE = 3,
}

// TODO : maybe make presets for music and speech, or lossy / lossless.

const HIGH_QUALITY: RecordingOptions = {
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

const LOW_QUALITY: RecordingOptions = {
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
export const RecordingOptionsPresets: Record<string, RecordingOptions> = {
  HIGH_QUALITY,
  LOW_QUALITY,
};
