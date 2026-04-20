import { AudioMetadata } from './Audio.types';
import { AudioLockScreenOptions } from './AudioConstants';

interface MediaSessionPlayer {
  play(): void;
  pause(): void;
  seekTo(seconds: number): Promise<void>;
  readonly playing: boolean;
  readonly currentTime: number;
  readonly duration: number;
  readonly playbackRate: number;
}

const SKIP_SECONDS = 10;

class MediaSessionController {
  private activePlayer: MediaSessionPlayer | null = null;
  private metadata: AudioMetadata | null = null;
  private options: AudioLockScreenOptions | null = null;

  setActivePlayer(
    player: MediaSessionPlayer,
    metadata?: AudioMetadata,
    options?: AudioLockScreenOptions
  ): void {
    if (!navigator.mediaSession) return;

    if (this.activePlayer && this.activePlayer !== player) {
      this.clear(this.activePlayer);
    }

    this.activePlayer = player;
    this.metadata = metadata ?? null;
    this.options = options ?? null;

    this._applyMetadata();
    this._applyActionHandlers();
    this.updatePlaybackState(player);
    this.updatePositionState(player);
  }

  updateMetadata(player: MediaSessionPlayer, metadata: AudioMetadata): void {
    if (!navigator.mediaSession) return;
    if (this.activePlayer !== player) return;

    this.metadata = metadata;
    this._applyMetadata();
  }

  clear(player: MediaSessionPlayer): void {
    if (!navigator.mediaSession) return;
    if (this.activePlayer !== player) return;

    this.activePlayer = null;
    this.metadata = null;
    this.options = null;

    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';

    const actions: MediaSessionAction[] = [
      'play',
      'pause',
      'seekto',
      'seekforward',
      'seekbackward',
      'previoustrack',
      'nexttrack',
    ];
    for (const action of actions) {
      this._setHandler(action, null);
    }

    try {
      navigator.mediaSession.setPositionState();
    } catch {}
  }

  updatePlaybackState(player: MediaSessionPlayer): void {
    if (!navigator.mediaSession) return;
    if (this.activePlayer !== player) return;

    navigator.mediaSession.playbackState = player.playing ? 'playing' : 'paused';
  }

  updatePositionState(player: MediaSessionPlayer): void {
    if (!navigator.mediaSession) return;
    if (this.activePlayer !== player) return;

    const duration = player.duration;

    if (!Number.isFinite(duration) || duration <= 0) return;

    const position = Math.min(Math.max(player.currentTime, 0), duration);
    const playbackRate = player.playbackRate || 1;

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate,
        position,
      });
    } catch {}
  }

  isActive(player: MediaSessionPlayer): boolean {
    return this.activePlayer === player;
  }

  getActiveState(
    player: MediaSessionPlayer
  ): { metadata: AudioMetadata | null; options: AudioLockScreenOptions | null } | null {
    if (this.activePlayer !== player) return null;
    return { metadata: this.metadata, options: this.options };
  }

  private _applyMetadata(): void {
    if (!this.metadata) {
      navigator.mediaSession.metadata = null;
      return;
    }

    const { title, artist, albumTitle, artworkUrl } = this.metadata;
    const artwork: MediaImage[] = artworkUrl ? [{ src: artworkUrl }] : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title ?? '',
      artist: artist ?? '',
      album: albumTitle ?? '',
      artwork,
    });
  }

  private _setHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null): void {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {}
  }

  private _applyActionHandlers(): void {
    const player = this.activePlayer;
    if (!player) return;

    this._setHandler('play', () => {
      player.play();
    });

    this._setHandler('pause', () => {
      player.pause();
    });

    this._setHandler('seekto', (details) => {
      if (details.seekTime != null) {
        player.seekTo(details.seekTime);
        this.updatePositionState(player);
      }
    });

    const seekForward = (details: MediaSessionActionDetails) => {
      const skipTime = details.seekOffset ?? SKIP_SECONDS;
      const newTime = Math.min(player.currentTime + skipTime, player.duration || 0);
      player.seekTo(newTime);
      this.updatePositionState(player);
    };

    const seekBackward = (details: MediaSessionActionDetails) => {
      const skipTime = details.seekOffset ?? SKIP_SECONDS;
      const newTime = Math.max(player.currentTime - skipTime, 0);
      player.seekTo(newTime);
      this.updatePositionState(player);
    };

    if (this.options?.showSeekForward === true) {
      this._setHandler('seekforward', seekForward);
      this._setHandler('nexttrack', seekForward);
    } else {
      this._setHandler('seekforward', null);
      this._setHandler('nexttrack', null);
    }

    if (this.options?.showSeekBackward === true) {
      this._setHandler('seekbackward', seekBackward);
      this._setHandler('previoustrack', seekBackward);
    } else {
      this._setHandler('seekbackward', null);
      this._setHandler('previoustrack', null);
    }
  }
}

export const mediaSessionController = new MediaSessionController();
