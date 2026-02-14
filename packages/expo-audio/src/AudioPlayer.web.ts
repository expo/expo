import {
  AudioMetadata,
  AudioPlayerOptions,
  AudioSource,
  AudioStatus,
  PitchCorrectionQuality,
} from './Audio.types';
import { AudioLockScreenOptions } from './AudioConstants';
import { AUDIO_SAMPLE_UPDATE, PLAYBACK_STATUS_UPDATE } from './AudioEventKeys';
import { AudioPlayer, AudioEvents } from './AudioModule.types';
import { getAudioContext, getSourceUri, getStatusFromMedia, nextId } from './AudioUtils.web';
import { mediaSessionController } from './MediaSessionController.web';

export class AudioPlayerWeb
  extends globalThis.expo.SharedObject<AudioEvents>
  implements AudioPlayer
{
  constructor(source: AudioSource, options: AudioPlayerOptions = {}) {
    super();
    const { updateInterval = 500, crossOrigin } = options;
    this.src = source;
    this.interval = Math.max(updateInterval, 1);
    this.crossOrigin = crossOrigin;
    this.media = this._createMediaElement();
  }

  id: number = nextId();
  isAudioSamplingSupported = false;
  isBuffering = false;
  shouldCorrectPitch = false;

  private src: AudioSource = null;
  private media: HTMLAudioElement;
  private interval = 500;
  private isPlaying = false;
  private loaded = false;
  private crossOrigin?: 'anonymous' | 'use-credentials';
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private samplingFrameId: number | null = null;
  private samplingEnabled = false;

  get playing(): boolean {
    return this.isPlaying;
  }

  get muted(): boolean {
    return this.media.muted;
  }

  set muted(value: boolean) {
    this.media.muted = value;
  }

  get loop(): boolean {
    return this.media.loop;
  }

  set loop(value: boolean) {
    this.media.loop = value;
  }

  get duration(): number {
    return this.media.duration;
  }

  get currentTime(): number {
    return this.media.currentTime;
  }

  get paused(): boolean {
    return this.media.paused;
  }

  get isLoaded(): boolean {
    return this.loaded;
  }

  get playbackRate(): number {
    return this.media.playbackRate;
  }

  set playbackRate(value: number) {
    this.media.playbackRate = value;
  }

  get volume(): number {
    return this.media.volume;
  }

  set volume(value: number) {
    this.media.volume = value;
  }

  get currentStatus(): AudioStatus {
    return getStatusFromMedia(this.media, this.id);
  }

  play(): void {
    this.media.play();
    this.isPlaying = true;
  }

  pause(): void {
    this.media.pause();
    this.isPlaying = false;
  }

  replace(source: AudioSource): void {
    const wasPlaying = this.isPlaying;
    const wasSampling = this.samplingEnabled;
    const mediaSessionState = mediaSessionController.getActiveState(this);

    // we need to remove the current media element and create a new one
    this.remove();

    this.src = source;
    this.isPlaying = false;
    this.loaded = false;
    this.media = this._createMediaElement();

    if (wasSampling) {
      this.setAudioSamplingEnabled(true);
    }

    if (mediaSessionState) {
      mediaSessionController.setActivePlayer(
        this,
        mediaSessionState.metadata ?? undefined,
        mediaSessionState.options ?? undefined
      );
    }

    // Resume playback if it was playing before
    if (wasPlaying) {
      this.play();
    }
  }

  async seekTo(
    seconds: number,
    toleranceMillisBefore?: number,
    toleranceMillisAfter?: number
  ): Promise<void> {
    this.media.currentTime = seconds;
  }

  setAudioSamplingEnabled(enabled: boolean): void {
    if (enabled) {
      if (!this.media.crossOrigin && this._isCrossOrigin()) {
        this.isAudioSamplingSupported = false;
        return;
      }

      if (this.analyser) {
        return;
      }

      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (!this.sourceNode) {
        this.sourceNode = ctx.createMediaElementSource(this.media);
      }

      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 2048;

      this.sourceNode.disconnect();
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(ctx.destination);

      const buffer = new Float32Array(this.analyser.frequencyBinCount);

      const sampleLoop = () => {
        if (!this.analyser) {
          return;
        }
        if (this.isPlaying) {
          this.analyser.getFloatTimeDomainData(buffer);
          this.emit(AUDIO_SAMPLE_UPDATE, {
            channels: [{ frames: Array.from(buffer) }],
            timestamp: this.media.currentTime,
          });
        }
        this.samplingFrameId = requestAnimationFrame(sampleLoop);
      };
      this.samplingFrameId = requestAnimationFrame(sampleLoop);

      this.samplingEnabled = true;
      this.isAudioSamplingSupported = true;
    } else {
      if (this.samplingFrameId != null) {
        cancelAnimationFrame(this.samplingFrameId);
        this.samplingFrameId = null;
      }

      if (this.analyser) {
        this.analyser.disconnect();
        this.analyser = null;
      }

      if (this.sourceNode) {
        const ctx = getAudioContext();
        this.sourceNode.disconnect();
        this.sourceNode.connect(ctx.destination);
      }

      this.samplingEnabled = false;
    }
  }

  setPlaybackRate(second: number, pitchCorrectionQuality?: PitchCorrectionQuality): void {
    this.media.playbackRate = second;
    this.shouldCorrectPitch = pitchCorrectionQuality === 'high';
    this.media.preservesPitch = this.shouldCorrectPitch;
    mediaSessionController.updatePositionState(this);
  }

  remove(): void {
    mediaSessionController.clear(this);

    if (this.samplingFrameId != null) {
      cancelAnimationFrame(this.samplingFrameId);
      this.samplingFrameId = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.samplingEnabled = false;
    this.media.pause();
    this.media.removeAttribute('src');
    this.media.load();
    getStatusFromMedia(this.media, this.id);
  }

  setActiveForLockScreen(
    active: boolean,
    metadata?: AudioMetadata,
    options?: AudioLockScreenOptions
  ): void {
    if (active) {
      mediaSessionController.setActivePlayer(this, metadata, options);
    } else {
      mediaSessionController.clear(this);
    }
  }

  updateLockScreenMetadata(metadata: AudioMetadata): void {
    mediaSessionController.updateMetadata(this, metadata);
  }

  clearLockScreenControls(): void {
    mediaSessionController.clear(this);
  }

  _isCrossOrigin(): boolean {
    try {
      return new URL(this.media.src).origin !== window.location.origin;
    } catch {
      return false;
    }
  }

  _createMediaElement(): HTMLAudioElement {
    const newSource = getSourceUri(this.src);
    const media = new Audio(newSource);
    if (this.crossOrigin !== undefined) {
      media.crossOrigin = this.crossOrigin;
    }

    let lastEmitTime = 0;
    const intervalSec = this.interval / 1000;

    // Throttled status updates based on interval
    media.ontimeupdate = () => {
      const now = media.currentTime;
      // Handle backwards time (loop/seek)
      if (now < lastEmitTime) {
        lastEmitTime = now;
      }
      if (now - lastEmitTime >= intervalSec) {
        lastEmitTime = now;
        this.emit(PLAYBACK_STATUS_UPDATE, getStatusFromMedia(media, this.id));
        mediaSessionController.updatePositionState(this);
      }
    };

    media.onplay = () => {
      this.isPlaying = true;
      lastEmitTime = media.currentTime;
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        playing: this.isPlaying,
      });
      mediaSessionController.updatePlaybackState(this);
      mediaSessionController.updatePositionState(this);
    };

    media.onpause = () => {
      this.isPlaying = false;
      lastEmitTime = media.currentTime;
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        playing: this.isPlaying,
      });
      mediaSessionController.updatePlaybackState(this);
      mediaSessionController.updatePositionState(this);
    };

    media.onseeked = () => {
      lastEmitTime = media.currentTime;
      this.emit(PLAYBACK_STATUS_UPDATE, getStatusFromMedia(media, this.id));
      mediaSessionController.updatePositionState(this);
    };

    media.onended = () => {
      lastEmitTime = 0;
      mediaSessionController.updatePlaybackState(this);
    };

    media.onloadeddata = () => {
      this.loaded = true;
      lastEmitTime = media.currentTime;
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        isLoaded: this.loaded,
      });
      mediaSessionController.updatePositionState(this);
    };

    return media;
  }
}
