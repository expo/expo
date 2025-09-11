import { type RecordingOptions } from './Audio.types';

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

/**
 * Audio quality levels for recording.
 *
 * Predefined quality levels that balance file size and audio fidelity.
 * Higher quality levels produce better sound but larger files and require more processing power.
 */
export enum AudioQuality {
  /** Minimum quality: smallest file size, lowest fidelity. */
  MIN = 0,
  /** Low quality: good for voice recordings where file size matters. */
  LOW = 0x20,
  /** Medium quality: balanced option for most use cases. */
  MEDIUM = 0x40,
  /** High quality: good fidelity, larger file size. */
  HIGH = 0x60,
  /** Maximum quality: best fidelity, largest file size. */
  MAX = 0x7f,
}

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
 * RecordingPresets.HIGH_QUALITY = {
 *  extension: '.m4a',
 *   sampleRate: 44100,
 *   numberOfChannels: 2,
 *   bitRate: 128000,
 *   android: {
 *     outputFormat: 'mpeg4',
 *     audioEncoder: 'aac',
 *   },
 *   ios: {
 *     outputFormat: IOSOutputFormat.MPEG4AAC,
 *     audioQuality: AudioQuality.MAX,
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
 * RecordingPresets.LOW_QUALITY = {
 *   extension: '.m4a',
 *   sampleRate: 44100,
 *   numberOfChannels: 2,
 *   bitRate: 64000,
 *   android: {
 *     extension: '.3gp',
 *     outputFormat: '3gp',
 *     audioEncoder: 'amr_nb',
 *   },
 *   ios: {
 *     audioQuality: AudioQuality.MIN,
 *     outputFormat: IOSOutputFormat.MPEG4AAC,
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
export const RecordingPresets: Record<string, RecordingOptions> = {
  HIGH_QUALITY,
  LOW_QUALITY,
};
