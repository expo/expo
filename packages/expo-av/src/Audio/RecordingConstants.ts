import type { RecordingOptions } from './Recording.types';

/**
 * Defines the output format.
 * @platform android
 */
export enum AndroidOutputFormat {
  DEFAULT = 0,
  /**
   * 3GPP media file format.
   */
  THREE_GPP = 1,
  /**
   * MPEG4 media file format.
   */
  MPEG_4 = 2,
  /**
   * AMR NB file format.
   */
  AMR_NB = 3,
  /**
   * AMR WB file format.
   */
  AMR_WB = 4,
  // @docsMissing
  AAC_ADIF = 5,
  /**
   * AAC ADTS file format.
   */
  AAC_ADTS = 6,
  // @docsMissing
  RTP_AVP = 7,
  /**
   * H.264/AAC data encapsulated in MPEG2/TS.
   */
  MPEG2TS = 8,
  /**
   * VP8/VORBIS data in a WEBM container.
   */
  WEBM = 9,
}

/**
 * Defines the audio encoding.
 * @platform android
 */
export enum AndroidAudioEncoder {
  DEFAULT = 0,
  /**
   * AMR (Narrowband) audio codec.
   */
  AMR_NB = 1,
  /**
   * AMR (Wideband) audio codec.
   */
  AMR_WB = 2,
  /**
   * AAC Low Complexity (AAC-LC) audio codec.
   */
  AAC = 3,
  /**
   * High Efficiency AAC (HE-AAC) audio codec.
   */
  HE_AAC = 4,
  /**
   * Enhanced Low Delay AAC (AAC-ELD) audio codec.
   */
  AAC_ELD = 5,
}

// @docsMissing
/**
 * > **Note:** Not all of the iOS formats included in this list of constants are currently supported by iOS,
 * > in spite of appearing in the Apple source code. For an accurate list of formats supported by iOS, see
 * > [Core Audio Codecs](https://developer.apple.com/library/content/documentation/MusicAudio/Conceptual/CoreAudioOverview/CoreAudioEssentials/CoreAudioEssentials.html)
 * > and [iPhone Audio File Formats](https://developer.apple.com/library/content/documentation/MusicAudio/Conceptual/CoreAudioOverview/CoreAudioEssentials/CoreAudioEssentials.html).
 *
 * @platform ios
 */
export enum IOSOutputFormat {
  LINEARPCM = 'lpcm',
  AC3 = 'ac-3',
  '60958AC3' = 'cac3',
  APPLEIMA4 = 'ima4',
  MPEG4AAC = 'aac ',
  MPEG4CELP = 'celp',
  MPEG4HVXC = 'hvxc',
  MPEG4TWINVQ = 'twvq',
  MACE3 = 'MAC3',
  MACE6 = 'MAC6',
  ULAW = 'ulaw',
  ALAW = 'alaw',
  QDESIGN = 'QDMC',
  QDESIGN2 = 'QDM2',
  QUALCOMM = 'Qclp',
  MPEGLAYER1 = '.mp1',
  MPEGLAYER2 = '.mp2',
  MPEGLAYER3 = '.mp3',
  APPLELOSSLESS = 'alac',
  MPEG4AAC_HE = 'aach',
  MPEG4AAC_LD = 'aacl',
  MPEG4AAC_ELD = 'aace',
  MPEG4AAC_ELD_SBR = 'aacf',
  MPEG4AAC_ELD_V2 = 'aacg',
  MPEG4AAC_HE_V2 = 'aacp',
  MPEG4AAC_SPATIAL = 'aacs',
  AMR = 'samr',
  AMR_WB = 'sawb',
  AUDIBLE = 'AUDB',
  ILBC = 'ilbc',
  DVIINTELIMA = 0x6d730011,
  MICROSOFTGSM = 0x6d730031,
  AES3 = 'aes3',
  ENHANCEDAC3 = 'ec-3',
}

// @docsMissing
/**
 * @platform ios
 */
export enum IOSAudioQuality {
  MIN = 0,
  LOW = 0x20,
  MEDIUM = 0x40,
  HIGH = 0x60,
  MAX = 0x7f,
}

// @docsMissing
/**
 * @platform ios
 */
export enum IOSBitRateStrategy {
  CONSTANT = 0,
  LONG_TERM_AVERAGE = 1,
  VARIABLE_CONSTRAINED = 2,
  VARIABLE = 3,
}

// TODO : maybe make presets for music and speech, or lossy / lossless.

const HIGH_QUALITY: RecordingOptions = {
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

const LOW_QUALITY: RecordingOptions = {
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
export const RecordingOptionsPresets: Record<string, RecordingOptions> = {
  HIGH_QUALITY,
  LOW_QUALITY,
};
