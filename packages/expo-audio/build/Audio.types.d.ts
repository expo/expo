export type AudioSource = string | number | null | {
    /**
     * A string representing the resource identifier for the audio,
     * which could be an HTTPS address, a local file path, or the name of a static audio file resource.
     */
    uri?: string;
    /**
     * The asset ID of a local audio asset, acquired with the `require` function.
     * This property is exclusive with the `uri` property. When both are present, the `assetId` will be ignored.
     */
    assetId?: number;
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
export type PitchCorrectionQuality = 'low' | 'medium' | 'high';
export type AudioStatus = {
    id: number;
    currentTime: number;
    playbackState: string;
    timeControlStatus: string;
    reasonForWaitingToPlay: string;
    mute: boolean;
    duration: number;
    currentQueueIndex: number | null;
    playing: boolean;
    loop: boolean;
    didJustFinish: boolean;
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
    url: string | null;
};
export type RecorderState = {
    canRecord: boolean;
    isRecording: boolean;
    durationMillis: number;
    mediaServicesDidReset: boolean;
    metering?: number;
    url: string | null;
};
/**
 * @platform android
 */
export type AndroidOutputFormat = 'default' | '3gp' | 'mpeg4' | 'amrnb' | 'amrwb' | 'aac_adts' | 'mpeg2ts' | 'webm';
/**
 * @platform android
 */
export type AndroidAudioEncoder = 'default' | 'amr_nb' | 'amr_wb' | 'aac' | 'he_aac' | 'aac_eld';
/**
 * @platform ios
 */
export declare enum IOSOutputFormat {
    LINEARPCM = "lpcm",
    AC3 = "ac-3",
    '60958AC3' = "cac3",
    APPLEIMA4 = "ima4",
    MPEG4AAC = "aac ",
    MPEG4CELP = "celp",
    MPEG4HVXC = "hvxc",
    MPEG4TWINVQ = "twvq",
    MACE3 = "MAC3",
    MACE6 = "MAC6",
    ULAW = "ulaw",
    ALAW = "alaw",
    QDESIGN = "QDMC",
    QDESIGN2 = "QDM2",
    QUALCOMM = "Qclp",
    MPEGLAYER1 = ".mp1",
    MPEGLAYER2 = ".mp2",
    MPEGLAYER3 = ".mp3",
    APPLELOSSLESS = "alac",
    MPEG4AAC_HE = "aach",
    MPEG4AAC_LD = "aacl",
    MPEG4AAC_ELD = "aace",
    MPEG4AAC_ELD_SBR = "aacf",
    MPEG4AAC_ELD_V2 = "aacg",
    MPEG4AAC_HE_V2 = "aacp",
    MPEG4AAC_SPATIAL = "aacs",
    AMR = "samr",
    AMR_WB = "sawb",
    AUDIBLE = "AUDB",
    ILBC = "ilbc",
    DVIINTELIMA = 1836253201,
    MICROSOFTGSM = 1836253233,
    AES3 = "aes3",
    ENHANCEDAC3 = "ec-3"
}
export declare enum AudioQuality {
    MIN = 0,
    LOW = 32,
    MEDIUM = 64,
    HIGH = 96,
    MAX = 127
}
export type BitRateStrategy = 'constant' | 'longTermAverage' | 'variableConstrained' | 'variable';
export type RecordingOptions = {
    /**
     * A boolean that determines whether audio level information will be part of the status object under the "metering" key.
     */
    isMeteringEnabled?: boolean;
    /**
     * The desired file extension.
     *
     * @example .caf
     */
    extension: string;
    /**
     * The desired sample rate.
     *
     * @example 44100
     */
    sampleRate: number;
    /**
     * The desired number of channels.
     *
     * @example 2
     */
    numberOfChannels: number;
    /**
     * The desired bit rate.
     *
     * @example 128000
     */
    bitRate: number;
    /**
     * Recording options for the Android platform.
     * @platform android
     */
    android: RecordingOptionsAndroid;
    /**
     * Recording options for the iOS platform.
     * @platform ios
     */
    ios: RecordingOptionsIos;
    /**
     * Recording options for the Web platform.
     * @platform web
     */
    web?: RecordingOptionsWeb;
};
/**
 * @platform web
 */
export type RecordingOptionsWeb = {
    mimeType?: string;
    bitsPerSecond?: number;
};
/**
 * @platform ios
 */
export type RecordingOptionsIos = {
    /**
     * The desired file extension.
     *
     * @example .caf
     */
    extension?: string;
    /**
     * The desired sample rate.
     *
     * @example 44100
     */
    sampleRate?: number;
    /**
     * The desired file format. See the [`IOSOutputFormat`](#iosoutputformat) enum for all valid values.
     */
    outputFormat?: string | IOSOutputFormat | number;
    /**
     * The desired audio quality. See the [`AudioQuality`](#audioquality) enum for all valid values.
     */
    audioQuality: AudioQuality | number;
    /**
     * The desired bit rate strategy. See the next section for an enumeration of all valid values of `bitRateStrategy`.
     */
    bitRateStrategy?: number;
    /**
     * The desired bit depth hint.
     *
     * @example 16
     */
    bitDepthHint?: number;
    /**
     * The desired PCM bit depth.
     *
     * @example 16
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
/**
 * @platform android
 */
export type RecordingOptionsAndroid = {
    /**
     * The desired file extension.
     *
     * @example .caf
     */
    extension?: string;
    /**
     * The desired sample rate.
     *
     * @example 44100
     */
    sampleRate?: number;
    /**
     * The desired file format. See the [`AndroidOutputFormat`](#androidoutputformat) enum for all valid values.
     */
    outputFormat: AndroidOutputFormat;
    /**
     * The desired audio encoder. See the [`AndroidAudioEncoder`](#androidaudioencoder) enum for all valid values.
     */
    audioEncoder: AndroidAudioEncoder;
    /**
     * The desired maximum file size in bytes, after which the recording will stop (but `stopAndUnloadAsync()` must still
     * be called after this point).
     *
     * @example
     * `65536`
     */
    maxFileSize?: number;
};
export type AudioMode = {
    /**
     * Determines if audio playback is allowed when the device is in silent mode.
     *
     * @platform ios
     */
    playsInSilentMode: boolean;
    /**
     * Determines how the audio session interacts with other sessions.
     *
     * @platform ios
     */
    interruptionMode: InterruptionMode;
    /**
     * Whether the audio session allows recording.
     *
     * @default false
     * @platform ios
     */
    allowsRecording: boolean;
    /**
     * Whether the audio session stays active when the app moves to the background.
     * @default false
     */
    shouldPlayInBackground: boolean;
    /**
     * Whether the audio should route through the earpiece.
     * @platform android
     */
    shouldRouteThroughEarpiece: boolean;
};
export type InterruptionMode = 'mixWithOthers' | 'doNotMix' | 'duckOthers';
//# sourceMappingURL=Audio.types.d.ts.map