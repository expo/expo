import {
  AudioPlaylistLoopMode,
  AudioPlaylistStatus,
  AudioSource,
  AudioSourceInfo,
} from './Audio.types';
import { PLAYLIST_STATUS_UPDATE, TRACK_CHANGED } from './AudioEventKeys';
import { AudioPlaylist, AudioPlaylistEvents } from './AudioModule.types';
import { getSourceUri, nextId } from './AudioUtils.web';
import { resolveSource } from './utils/resolveSource';

function getSourceInfo(source: AudioSource): AudioSourceInfo {
  const resolved = resolveSource(source);
  if (resolved && typeof resolved === 'object') {
    return {
      uri: resolved.uri,
      name: resolved.name,
    };
  }
  return { uri: getSourceUri(source) };
}

export class AudioPlaylistWeb
  extends globalThis.expo.SharedObject<AudioPlaylistEvents>
  implements AudioPlaylist
{
  constructor(
    initialSources: AudioSource[] = [],
    updateInterval: number = 500,
    loopMode: AudioPlaylistLoopMode = 'none',
    crossOrigin?: 'anonymous' | 'use-credentials'
  ) {
    super();
    this._updateInterval = Math.max(updateInterval, 1);
    this._loopMode = loopMode;
    this._crossOrigin = crossOrigin;

    for (const source of initialSources) {
      this._sources.push(source);
      this._sourceInfos.push(getSourceInfo(source));
    }

    if (this._sources.length > 0) {
      this._currentMedia = this._createMediaElement(this._sources[0]);
      this._preloadNext();
    }
  }

  id: string = nextId();

  private _sources: AudioSource[] = [];
  private _sourceInfos: AudioSourceInfo[] = [];
  private _currentIndex = 0;
  private _currentMedia: HTMLAudioElement | null = null;
  private _nextMedia: HTMLAudioElement | null = null;
  private _updateInterval = 500;
  private _loopMode: AudioPlaylistLoopMode = 'none';
  private _isPlaying = false;
  private _isLoaded = false;
  private _isBuffering = false;
  private _volume = 1;
  private _muted = false;
  private _playbackRate = 1;
  private _crossOrigin?: 'anonymous' | 'use-credentials';
  private _knownDuration = 0;

  get currentIndex(): number {
    return this._currentIndex;
  }

  get trackCount(): number {
    return this._sources.length;
  }

  get sources(): AudioSourceInfo[] {
    return [...this._sourceInfos];
  }

  get playing(): boolean {
    return this._isPlaying;
  }

  get muted(): boolean {
    return this._muted;
  }

  set muted(value: boolean) {
    this._muted = value;
    if (this._currentMedia) {
      this._currentMedia.muted = value;
    }
  }

  get isLoaded(): boolean {
    return this._isLoaded;
  }

  get isBuffering(): boolean {
    return this._isBuffering;
  }

  get currentTime(): number {
    return this._currentMedia?.currentTime ?? 0;
  }

  get duration(): number {
    return this._knownDuration;
  }

  get volume(): number {
    return this._volume;
  }

  set volume(value: number) {
    this._volume = value;
    if (this._currentMedia) {
      this._currentMedia.volume = value;
    }
  }

  get playbackRate(): number {
    return this._playbackRate;
  }

  set playbackRate(value: number) {
    this._playbackRate = value;
    if (this._currentMedia) {
      this._currentMedia.playbackRate = value;
    }
  }

  get loop(): AudioPlaylistLoopMode {
    return this._loopMode;
  }

  set loop(value: AudioPlaylistLoopMode) {
    this._loopMode = value;
    this._emitStatus();
  }

  get currentStatus(): AudioPlaylistStatus {
    return this._getStatus();
  }

  play(): void {
    if (!this._currentMedia || this._sources.length === 0) {
      return;
    }
    this._currentMedia.play();
    this._isPlaying = true;
  }

  pause(): void {
    if (this._currentMedia) {
      this._currentMedia.pause();
      this._isPlaying = false;
    }
  }

  next(): void {
    if (this._sources.length === 0) return;

    const previousIndex = this._currentIndex;
    let nextIndex = this._currentIndex + 1;

    if (nextIndex >= this._sources.length) {
      if (this._loopMode === 'all') {
        nextIndex = 0;
      } else {
        return;
      }
    }

    this._transitionToTrack(nextIndex, previousIndex);
  }

  previous(): void {
    if (this._sources.length === 0) return;

    const previousIndex = this._currentIndex;
    let prevIndex = this._currentIndex - 1;

    if (prevIndex < 0) {
      if (this._loopMode === 'all') {
        prevIndex = this._sources.length - 1;
      } else {
        return;
      }
    }

    this._transitionToTrack(prevIndex, previousIndex);
  }

  skipTo(index: number): void {
    if (index < 0 || index >= this._sources.length) {
      return;
    }
    if (index === this._currentIndex) {
      return;
    }

    const previousIndex = this._currentIndex;
    this._transitionToTrack(index, previousIndex);
  }

  async seekTo(seconds: number): Promise<void> {
    if (this._currentMedia) {
      this._currentMedia.currentTime = seconds;
    }
  }

  add(source: AudioSource): void {
    this._sources.push(source);
    this._sourceInfos.push(getSourceInfo(source));

    if (this._sources.length === 1) {
      this._currentMedia = this._createMediaElement(source);
    } else {
      this._preloadNext();
    }

    this._emitStatus();
  }

  insert(source: AudioSource, index: number): void {
    if (index < 0) index = 0;
    if (index > this._sources.length) index = this._sources.length;

    this._sources.splice(index, 0, source);
    this._sourceInfos.splice(index, 0, getSourceInfo(source));

    if (index <= this._currentIndex && this._sources.length > 1) {
      this._currentIndex++;
    }

    if (this._sources.length === 1) {
      this._currentMedia = this._createMediaElement(source);
    } else {
      this._preloadNext();
    }

    this._emitStatus();
  }

  remove(index: number): void {
    if (index < 0 || index >= this._sources.length) {
      return;
    }

    const wasCurrentTrack = index === this._currentIndex;
    const wasPlaying = this._isPlaying;

    this._sources.splice(index, 1);
    this._sourceInfos.splice(index, 1);

    if (this._sources.length === 0) {
      this._cleanupMedia(this._currentMedia);
      this._currentMedia = null;
      this._cleanupMedia(this._nextMedia);
      this._nextMedia = null;
      this._currentIndex = 0;
      this._isPlaying = false;
      this._isLoaded = false;
      this._knownDuration = 0;
    } else if (wasCurrentTrack) {
      this._cleanupMedia(this._currentMedia);
      if (this._currentIndex >= this._sources.length) {
        this._currentIndex = this._sources.length - 1;
      }
      this._knownDuration = 0;
      this._currentMedia = this._createMediaElement(this._sources[this._currentIndex]);
      if (wasPlaying) {
        this._currentMedia.play();
      }
      this._preloadNext();
    } else if (index < this._currentIndex) {
      this._currentIndex--;
      this._preloadNext();
    } else {
      this._preloadNext();
    }

    this._emitStatus();
  }

  clear(): void {
    this._cleanupMedia(this._currentMedia);
    this._currentMedia = null;
    this._cleanupMedia(this._nextMedia);
    this._nextMedia = null;
    this._sources = [];
    this._sourceInfos = [];
    this._currentIndex = 0;
    this._isPlaying = false;
    this._isLoaded = false;
    this._knownDuration = 0;
    this._emitStatus();
  }

  destroy(): void {
    this.clear();
  }

  private _transitionToTrack(newIndex: number, previousIndex: number): void {
    const wasPlaying = this._isPlaying;

    if (this._currentMedia) {
      this._currentMedia.pause();
      this._cleanupMedia(this._currentMedia);
    }

    this._currentIndex = newIndex;
    this._isLoaded = false;
    this._isBuffering = true;
    this._knownDuration = 0;

    const isNextSequential = newIndex === (previousIndex + 1) % this._sources.length;
    if (this._nextMedia && isNextSequential) {
      this._currentMedia = this._nextMedia;
      this._attachMediaHandlers(this._currentMedia);
      this._nextMedia = null;
    } else {
      this._cleanupMedia(this._nextMedia);
      this._nextMedia = null;
      this._currentMedia = this._createMediaElement(this._sources[newIndex]);
    }

    if (wasPlaying) {
      this._currentMedia.play();
      this._isPlaying = true;
    }

    this._preloadNext();

    this.emit(TRACK_CHANGED, { previousIndex, currentIndex: newIndex });
    this._emitStatus();
  }

  private _preloadNext(): void {
    if (this._nextMedia) {
      this._cleanupMedia(this._nextMedia);
      this._nextMedia = null;
    }

    // No need to preload if single track or 'single' loop mode
    if (this._sources.length <= 1 || this._loopMode === 'single') {
      return;
    }

    let nextIndex = this._currentIndex + 1;
    if (nextIndex >= this._sources.length) {
      if (this._loopMode === 'all') {
        nextIndex = 0;
      } else {
        return;
      }
    }

    const uri = getSourceUri(this._sources[nextIndex]);
    if (uri) {
      this._nextMedia = new Audio(uri);
      if (this._crossOrigin !== undefined) {
        this._nextMedia.crossOrigin = this._crossOrigin;
      }
      this._nextMedia.preload = 'auto';
      this._nextMedia.volume = this._volume;
      this._nextMedia.muted = this._muted;
      this._nextMedia.playbackRate = this._playbackRate;
    }
  }

  private _cleanupMedia(media: HTMLAudioElement | null): void {
    if (!media) return;
    media.pause();

    media.ontimeupdate = null;
    media.onplay = null;
    media.onpause = null;
    media.onseeked = null;
    media.onended = null;
    media.onloadedmetadata = null;
    media.onloadeddata = null;
    media.onwaiting = null;
    media.oncanplaythrough = null;
    media.onerror = null;
    media.removeAttribute('src');
    media.load();
  }

  private _attachMediaHandlers(media: HTMLAudioElement): void {
    let lastEmitTime = 0;
    const intervalSec = this._updateInterval / 1000;

    if (media.readyState >= 1) {
      const duration = media.duration;
      if (!isNaN(duration) && isFinite(duration)) {
        this._knownDuration = duration;
      }
    }

    media.ontimeupdate = () => {
      const now = media.currentTime;
      if (now < lastEmitTime) {
        lastEmitTime = now;
      }
      if (now - lastEmitTime >= intervalSec) {
        lastEmitTime = now;
        this._emitStatus();
      }
    };

    media.onplay = () => {
      this._isPlaying = true;
      lastEmitTime = media.currentTime;
      this._emitStatus();
    };

    media.onpause = () => {
      if (!media.ended) {
        this._isPlaying = false;
      }
      lastEmitTime = media.currentTime;
      this._emitStatus();
    };

    media.onseeked = () => {
      lastEmitTime = media.currentTime;
      this._emitStatus();
    };

    media.onended = () => {
      lastEmitTime = 0;
      this._handleTrackEnded();
    };

    media.onloadedmetadata = () => {
      const duration = media.duration;
      if (!isNaN(duration) && isFinite(duration)) {
        this._knownDuration = duration;
        this._emitStatus();
      }
    };

    media.onloadeddata = () => {
      this._isLoaded = true;
      this._isBuffering = false;
      lastEmitTime = media.currentTime;
      this._emitStatus();
    };

    media.onwaiting = () => {
      this._isBuffering = true;
      this._emitStatus();
    };

    media.oncanplaythrough = () => {
      this._isBuffering = false;
      this._emitStatus();
    };

    media.onerror = () => {
      this._isLoaded = false;
      this._isBuffering = false;
      this._isPlaying = false;
      this._emitStatus();
    };
  }

  private _createMediaElement(source: AudioSource): HTMLAudioElement {
    const uri = getSourceUri(source);
    const media = new Audio(uri);
    if (this._crossOrigin !== undefined) {
      media.crossOrigin = this._crossOrigin;
    }
    media.volume = this._volume;
    media.muted = this._muted;
    media.playbackRate = this._playbackRate;
    this._attachMediaHandlers(media);
    return media;
  }

  private _handleTrackEnded(): void {
    if (this._loopMode === 'single') {
      if (this._currentMedia) {
        this._currentMedia.currentTime = 0;
        this._currentMedia.play();
      }
      return;
    }

    const isLastTrack = this._currentIndex >= this._sources.length - 1;

    if (isLastTrack) {
      if (this._loopMode === 'all') {
        this._transitionToTrack(0, this._currentIndex);
      } else {
        this._isPlaying = false;
        this.emit(PLAYLIST_STATUS_UPDATE, {
          ...this._getStatus(),
          didJustFinish: true,
        });
      }
    } else {
      this._transitionToTrack(this._currentIndex + 1, this._currentIndex);
    }
  }

  private _getStatus(): AudioPlaylistStatus {
    return {
      id: this.id,
      currentIndex: this._currentIndex,
      trackCount: this._sources.length,
      currentTime: this._currentMedia?.currentTime ?? 0,
      duration: this._knownDuration,
      playing: this._isPlaying,
      isBuffering: this._isBuffering,
      isLoaded: this._isLoaded,
      playbackRate: this._playbackRate,
      muted: this._muted,
      volume: this._volume,
      loop: this._loopMode,
      didJustFinish: false,
    };
  }

  private _emitStatus(): void {
    this.emit(PLAYLIST_STATUS_UPDATE, this._getStatus());
  }
}
