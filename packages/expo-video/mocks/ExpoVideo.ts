import type { VideoPlayerStatus, BufferOptions, AudioMixingMode, VideoThumbnail } from '../src';

export type VideoContentFit = any;

export type CGVector = any;

export type FullscreenOptions = any;

export type VideoSource = any;

export type CMTime = any;

export type VideoThumbnailOptions = any;

export type VideoTrack = any;

export type SubtitleTrack = any;

export type AudioTrack = any;

export function isPictureInPictureSupported(): boolean {
  return false;
}

export function getCurrentVideoCacheSize(): any {}

export async function setVideoCacheSizeAsync(size: void): Promise<any> {}

export async function clearVideoCacheAsync(): Promise<any> {}

export type VideoViewProps = {
  player: typeof VideoPlayer | undefined;
  nativeControls: boolean | undefined;
  contentFit: VideoContentFit | undefined;
  contentPosition: CGVector | undefined;
  allowsFullscreen: boolean | undefined;
  fullscreenOptions: FullscreenOptions | undefined;
  showsTimecodes: boolean | undefined;
  requiresLinearPlayback: boolean | undefined;
  allowsPictureInPicture: boolean | undefined;
  startsPictureInPictureAutomatically: boolean | undefined;
  allowsVideoFrameAnalysis: boolean | undefined;
  onPictureInPictureStart: (event: any) => void;
  onPictureInPictureStop: (event: any) => void;
  onFullscreenEnter: (event: any) => void;
  onFullscreenExit: (event: any) => void;
  onFirstFrameRender: (event: any) => void;
};

export function VideoView(props: VideoViewProps) {}

export type VideoAirPlayButtonViewProps = {
  tint: any | undefined;
  activeTint: any | undefined;
  prioritizeVideoDevices: boolean | undefined;
  onBeginPresentingRoutes: (event: any) => void;
  onEndPresentingRoutes: (event: any) => void;
};

export function VideoAirPlayButtonView(props: VideoAirPlayButtonViewProps) {}

export const VideoPlayer = (source: VideoSource, useSynchronousReplace?: boolean) => ({
  // ----------------------------------------------------------------
  // Readonly Properties (with default mock values)
  // ----------------------------------------------------------------
  playing: false,
  currentLiveTimestamp: null,
  currentOffsetFromLive: null,
  duration: 0,
  isLive: false,
  status: 'idle' as VideoPlayerStatus,
  bufferedPosition: 0,
  availableAudioTracks: [] as AudioTrack[],
  availableSubtitleTracks: [] as SubtitleTrack[],
  videoTrack: null as VideoTrack | null,
  availableVideoTracks: [] as VideoTrack[],
  isExternalPlaybackActive: false,

  // ----------------------------------------------------------------
  // Writable Properties (with default mock values)
  // ----------------------------------------------------------------
  loop: false,
  allowsExternalPlayback: true,
  audioMixingMode: 'auto' as AudioMixingMode,
  muted: false,
  currentTime: 0,
  targetOffsetFromLive: 0,
  volume: 1.0,
  preservesPitch: true,
  timeUpdateEventInterval: 0,
  playbackRate: 1.0,
  keepScreenOnWhilePlaying: true,
  showNowPlayingNotification: false,
  staysActiveInBackground: false,
  bufferOptions: {
    preferForwardBuffer: false,
    maxBitrate: 0,
    minTime: 0,
    maxTime: 0,
  } as BufferOptions,
  subtitleTrack: null as SubtitleTrack | null,
  audioTrack: null as AudioTrack | null,

  // ----------------------------------------------------------------
  // Methods (mocked with jest.fn() or simple functions)
  // ----------------------------------------------------------------
  play: jest.fn(),
  pause: jest.fn(),
  replace: jest.fn(),
  seekBy: jest.fn(),
  replay: jest.fn(),
  release: jest.fn(), // From SharedObject parent class

  // Async Methods
  replaceAsync: jest.fn().mockResolvedValue(undefined),
  generateThumbnailsAsync: jest.fn().mockResolvedValue([] as VideoThumbnail[]),

  // --- Methods from SharedObject ---
  // You can add mock implementations for event listeners if needed
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  emit: jest.fn(),
  listenerCount: jest.fn().mockReturnValue(0),
});
