/**
 * Hand-maintained mock for the ExpoVideo native module.
 *
 * `expo-video` exposes two SharedObject-backed classes (`VideoPlayer` and
 * `VideoThumbnail`) on top of a handful of plain functions. The generated mock
 * table in `jest-expo` only describes flat functions and constants, so it
 * cannot represent them, and `VideoPlayer.tsx` patches
 * `NativeVideoModule.VideoPlayer.prototype.replace` at module load, which
 * throws before any test body runs. This module is what `jest-expo`'s preset
 * feeds to `requireNativeModule('ExpoVideo')`.
 *
 * The player keeps just enough in-memory state (playback flag, current time,
 * current source) that tests can exercise play/pause/seek/replace instead of
 * asserting against inert stubs, and it emits the core change events
 * (`playingChange`, `sourceChange`, `mutedChange`, `volumeChange`,
 * `playbackRateChange`) so `useEvent`-driven components update in tests.
 *
 * Intended scope: behavior stops there. Time never advances on its own (no
 * `timeUpdate`/`playToEnd`), `status` never transitions, and the native views
 * are not mocked. Extend this file only for behavior the public docs promise
 * and component tests depend on.
 *
 * DO NOT regenerate this file with `expo-modules-test-core`. The generator
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
import type { VideoPlayerEvents } from '../src/VideoPlayerEvents.types';

// Annotate explicitly: the inferred type of the destructured constructor
// otherwise references expo-modules-core's internal declaration path, which is
// not portable in the emitted (composite) declarations.
const SharedObject: (typeof globalThis.expo)['SharedObject'] = globalThis.expo.SharedObject;
const SharedRef: (typeof globalThis.expo)['SharedRef'] = globalThis.expo.SharedRef;

export class VideoPlayer extends SharedObject<VideoPlayerEvents> {
  playing: boolean = false;
  loop: boolean = false;
  allowsExternalPlayback: boolean = true;
  audioMixingMode: AudioMixingMode = 'auto';
  currentTime: number = 0;
  currentLiveTimestamp: number | null = null;
  currentOffsetFromLive: number | null = null;
  targetOffsetFromLive: number = 0;
  duration: number = 0;
  preservesPitch: boolean = true;
  timeUpdateEventInterval: number = 0;
  keepScreenOnWhilePlaying: boolean = true;
  isLive: boolean = false;
  status: VideoPlayerStatus = 'readyToPlay';
  showNowPlayingNotification: boolean = false;
  staysActiveInBackground: boolean = false;
  bufferedPosition: number = 0;
  bufferOptions: BufferOptions = {
    // The documented `preferredForwardBufferDuration` default differs per
    // platform (Android: 20, iOS: 0); the mock uses the iOS value.
    preferredForwardBufferDuration: 0,
    waitsToMinimizeStalling: true,
    minBufferForPlayback: 2,
    maxBufferBytes: 0,
    prioritizeTimeOverSizeThreshold: false,
  };
  subtitleTrack: SubtitleTrack | null = null;
  audioTrack: AudioTrack | null = null;
  availableAudioTracks: AudioTrack[] = [];
  availableSubtitleTracks: SubtitleTrack[] = [];
  videoTrack: VideoTrack | null = null;
  availableVideoTracks: VideoTrack[] = [];
  maxResolution: VideoSize | null = null;
  isExternalPlaybackActive: boolean = false;
  seekTolerance: SeekTolerance = {
    toleranceBefore: 0,
    toleranceAfter: 0,
  };
  scrubbingModeOptions: ScrubbingModeOptions = {
    scrubbingModeEnabled: false,
    increaseCodecOperatingRate: true,
    enableDynamicScheduling: true,
    useDecodeOnlyFlag: true,
    allowSkippingMediaCodecFlush: true,
  };

  private _muted: boolean = false;
  private _volume: number = 1;
  private _playbackRate: number = 1;

  get muted(): boolean {
    return this._muted;
  }

  set muted(value: boolean) {
    if (value === this._muted) {
      return;
    }
    const oldMuted = this._muted;
    this._muted = value;
    this.emit('mutedChange', { muted: value, oldMuted });
  }

  get volume(): number {
    return this._volume;
  }

  set volume(value: number) {
    if (value === this._volume) {
      return;
    }
    const oldVolume = this._volume;
    this._volume = value;
    this.emit('volumeChange', { volume: value, oldVolume });
  }

  get playbackRate(): number {
    return this._playbackRate;
  }

  set playbackRate(value: number) {
    if (value === this._playbackRate) {
      return;
    }
    const oldPlaybackRate = this._playbackRate;
    this._playbackRate = value;
    this.emit('playbackRateChange', { playbackRate: value, oldPlaybackRate });
  }

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
    this.setPlaying(true);
  }

  pause(): void {
    this.setPlaying(false);
  }

  replace(source: VideoSource, _disableWarning?: boolean): void {
    this.applySource(source);
  }

  // Deliberately does not call `replace`: `VideoPlayer.tsx` patches the public
  // `replace` on the prototype, and the native module never routes the async
  // path through the sync one, so spies on `replace` must not record a call.
  async replaceAsync(source: VideoSource): Promise<void> {
    this.applySource(source);
  }

  seekBy(seconds: number): void {
    this.currentTime = Math.max(0, this.currentTime + seconds);
  }

  replay(): void {
    this.currentTime = 0;
    this.setPlaying(true);
  }

  private setPlaying(value: boolean): void {
    if (value === this.playing) {
      return;
    }
    const oldIsPlaying = this.playing;
    this.playing = value;
    this.emit('playingChange', { isPlaying: value, oldIsPlaying });
  }

  private applySource(source: VideoSource): void {
    const oldSource = this.source;
    this.source = source;
    this.currentTime = 0;
    this.emit('sourceChange', { source, oldSource });
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
  override nativeRefType = 'image';
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
  // a plain function and wrapped in `jest.fn()`, which makes it impossible to
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
