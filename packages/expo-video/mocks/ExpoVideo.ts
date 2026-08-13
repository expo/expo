/**
 * Hand-maintained mock for the ExpoVideo native module.
 *
 * `expo-video` exposes two SharedObject-backed classes (`VideoPlayer` and
 * `VideoThumbnail`) on top of a handful of plain functions. The generated mock
 * table in `jest-expo` only describes flat functions and constants, so it
 * cannot represent them — and `VideoPlayer.tsx` patches
 * `NativeVideoModule.VideoPlayer.prototype.replace` at module load, which
 * throws before any test body runs. This module is what `jest-expo`'s preset
 * feeds to `requireNativeModule('ExpoVideo')`.
 *
 * The player keeps just enough in-memory state (playback flag, current time,
 * current source) that tests can exercise play/pause/seek/replace instead of
 * asserting against inert stubs.
 *
 * DO NOT regenerate this file with `expo-modules-test-core` — the generator
 * emits a bare stub and will overwrite the behavior here. Same pattern as
 * `packages/expo-file-system/mocks/FileSystem.ts`.
 */

import type {
  AudioMixingMode,
  AudioTrack,
  BufferOptions,
  PlayerBuilderOptions,
  ScrubbingModeOptions,
  SeekTolerance,
  SubtitleTrack,
  VideoPlayerStatus,
  VideoSize,
  VideoSource,
  VideoThumbnailOptions,
  VideoTrack,
} from '../src/VideoPlayer.types';

// Annotate explicitly: the inferred type of the destructured constructor
// otherwise references expo-modules-core's internal declaration path, which is
// not portable in the emitted (composite) declarations.
const SharedObject: (typeof globalThis.expo)['SharedObject'] = globalThis.expo.SharedObject;
const SharedRef: (typeof globalThis.expo)['SharedRef'] = globalThis.expo.SharedRef;

export class VideoPlayer extends SharedObject {
  playing: boolean = false;
  loop: boolean = false;
  allowsExternalPlayback: boolean = true;
  audioMixingMode: AudioMixingMode = 'auto';
  muted: boolean = false;
  currentTime: number = 0;
  currentLiveTimestamp: number | null = null;
  currentOffsetFromLive: number | null = null;
  targetOffsetFromLive: number = 0;
  duration: number = 0;
  volume: number = 1;
  preservesPitch: boolean = true;
  timeUpdateEventInterval: number = 0;
  playbackRate: number = 1;
  keepScreenOnWhilePlaying: boolean = false;
  isLive: boolean = false;
  status: VideoPlayerStatus = 'readyToPlay';
  showNowPlayingNotification: boolean = true;
  staysActiveInBackground: boolean = false;
  bufferedPosition: number = 0;
  bufferOptions: BufferOptions = {};
  subtitleTrack: SubtitleTrack | null = null;
  audioTrack: AudioTrack | null = null;
  availableAudioTracks: AudioTrack[] = [];
  availableSubtitleTracks: SubtitleTrack[] = [];
  videoTrack: VideoTrack | null = null;
  availableVideoTracks: VideoTrack[] = [];
  maxResolution: VideoSize | null = null;
  isExternalPlaybackActive: boolean = false;
  seekTolerance: SeekTolerance = {};
  scrubbingModeOptions: ScrubbingModeOptions = {};

  /**
   * Test-only: the source the player was constructed with or last replaced to,
   * already parsed by `expo-video` into its object form.
   */
  source: VideoSource;

  constructor(
    source: VideoSource,
    _useSynchronousReplace?: boolean,
    _playerBuilderOptions?: PlayerBuilderOptions
  ) {
    super();
    this.source = source;
  }

  play(): void {
    this.playing = true;
  }

  pause(): void {
    this.playing = false;
  }

  replace(source: VideoSource, _disableWarning?: boolean): void {
    this.source = source;
    this.currentTime = 0;
  }

  async replaceAsync(source: VideoSource): Promise<void> {
    this.replace(source, true);
  }

  seekBy(seconds: number): void {
    this.currentTime = Math.max(0, this.currentTime + seconds);
  }

  replay(): void {
    this.currentTime = 0;
    this.playing = true;
  }

  async generateThumbnailsAsync(
    times: number | number[],
    options?: VideoThumbnailOptions
  ): Promise<VideoThumbnail[]> {
    const requestedTimes = Array.isArray(times) ? times : [times];
    return requestedTimes.map(
      (time) => new VideoThumbnail(time, options?.maxWidth ?? 0, options?.maxHeight ?? 0)
    );
  }
}

export class VideoThumbnail extends SharedRef<'image'> {
  requestedTime: number;
  actualTime: number;
  width: number;
  height: number;

  constructor(requestedTime: number = 0, width: number = 0, height: number = 0) {
    super();
    this.requestedTime = requestedTime;
    this.actualTime = requestedTime;
    this.width = width;
    this.height = height;
  }

  // Keep this override even though it only forwards to `SharedRef`. The preset
  // decides whether an export is a class by counting own properties on its
  // prototype, so a class carrying nothing but instance fields is mistaken for
  // a plain function and wrapped in `jest.fn()` — which makes it impossible to
  // construct. Same reason `FileSystemUploadTask` spells `release` out.
  release(): void {
    super.release();
  }
}

export function isPictureInPictureSupported(): boolean {
  return false;
}

export async function setVideoCacheSizeAsync(_sizeBytes: number): Promise<void> {}

export async function clearVideoCacheAsync(): Promise<void> {}

export function getCurrentVideoCacheSize(): number {
  return 0;
}
