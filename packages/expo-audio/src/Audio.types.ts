export type AudioSource = {
  /**
   * A string representing the resource identifier for the audio,
   * which could be an HTTPS address, a local file path, or the name of a static audio file resource.
   */
  uri?: string;
  /**
   * An object representing the HTTP headers to send along with the request for a remote audio source.
   * On web requires the `Access-Control-Allow-Origin` header returned by the server to include the current domain.
   */
  headers?: Record<string, string>;
};

export type RecordingInput = {
  name: string;
  type: string;
  uid: string;
};

export type AudioPlayerState = {
  isLoaded: boolean;
  isLooping: boolean;
  isMuted: boolean;
  positionMillis: number;
  durationMillis: number;
  rate: number;
  volume: number;
  playing: boolean;
  audioPan: number;
  shouldCorrectPitch: boolean;
};

export type PitchCorrectionQuality = 'low' | 'medium' | 'high';

export type AudioStatus = {
  id: number;
  currentTime: number;
  status: string;
  timeControlStatus: string;
  reasonForWaitingToPlay: string;
  mute: boolean;
  duration: number;
  playing: boolean;
  loop: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  playbackRate: number;
  shouldCorrectPitch: boolean;
};

export type RecordingStatus = {
  id: number;
  isFinished: boolean;
  hasError: boolean;
  error: string | null;
};

export type RecorderState = {
  canRecord: boolean;
  isRecording: boolean;
  durationMillis: number;
  mediaServicesDidReset: boolean;
  metering?: number;
};

export enum OutputFormat {
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

export enum AudioQuality {
  MIN = 0,
  LOW = 0x20,
  MEDIUM = 0x40,
  HIGH = 0x60,
  MAX = 0x7f,
}

export type BitRateStrategy = 'constant' | 'longTermAverage' | 'variableConstrained' | 'variable';

export type RecordingOptions = {
  /**
   * The desired file extension.
   *
   * @example `'.caf'`
   */
  extension: string;
  /**
   * The desired file format. See the [`IOSOutputFormat`](#iosoutputformat) enum for all valid values.
   */
  outputFormat?: string | OutputFormat | number;
  /**
   * The desired audio quality. See the [`IOSAudioQuality`](#iosaudioquality) enum for all valid values.
   */
  audioQuality: AudioQuality | number;
  /**
   * The desired sample rate.
   *
   * @example `44100`
   */
  sampleRate: number;
  /**
   * The desired number of channels.
   *
   * @example `1`, `2`
   */
  numberOfChannels: number;
  /**
   * The desired bit rate.
   *
   * @example `128000`
   */
  bitRate: number;
  /**
   * The desired bit rate strategy. See the next section for an enumeration of all valid values of `bitRateStrategy`.
   */
  bitRateStrategy?: BitRateStrategy;
  /**
   * The desired bit depth hint.
   *
   * @example `16`
   */
  bitDepthHint?: number;
  /**
   * The desired PCM bit depth.
   *
   * @example `16`
   */
  linearPCMBitDepth?: number;
  /**
   * A boolean describing if the PCM data should be formatted in big endian.
   */
  linearPCMIsBigEndian?: boolean;
  /**
   * A boolean describing if the PCM data should be encoded in floating point or integral values.
   */
  linearPCMIsFloat?: boolean;
};

export type AudioMode = {
  playsInSilentMode: boolean;
  interruptionMode: InterruptionMode;
  allowsRecording: boolean;
  shouldPlayInBackground: boolean;
};

type InterruptionMode = 'mixWithOthers' | 'doNotMix' | 'duckOthers';
