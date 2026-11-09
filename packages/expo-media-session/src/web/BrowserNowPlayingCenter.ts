import type { RemoteCommand, RemoteCommandKind } from '../MediaSession.types';
import type { NowPlayingCenter, NowPlayingCenterState } from './NowPlayingStack';

const actions: [MediaSessionAction, RemoteCommandKind][] = [
  ['play', 'play'],
  ['pause', 'pause'],
  ['seekto', 'seek'],
  ['seekforward', 'skipForward'],
  ['seekbackward', 'skipBackward'],
  ['nexttrack', 'nextTrack'],
  ['previoustrack', 'previousTrack'],
];

export class BrowserNowPlayingCenter implements NowPlayingCenter {
  private send: (command: RemoteCommand) => void = () => {};

  setCommandHandler(handler: (command: RemoteCommand) => void): void {
    this.send = handler;
  }

  apply(state: NowPlayingCenterState | null): void {
    const session = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined;
    if (!session) {
      return;
    }
    if (!state) {
      session.metadata = null;
      session.playbackState = 'none';
      for (const [action] of actions) {
        setHandler(session, action, null);
      }
      clearPositionState(session);
      return;
    }
    const { info } = state;
    session.metadata =
      typeof MediaMetadata !== 'undefined'
        ? new MediaMetadata({
            title: info.title ?? '',
            artist: info.artist ?? '',
            album: info.album ?? '',
            artwork: info.artworkUrl ? [{ src: info.artworkUrl }] : [],
          })
        : null;
    session.playbackState = state.isPlaying ? 'playing' : 'paused';
    for (const [action, kind] of actions) {
      const offered = state.commands.has(kind) || offersToggle(state, kind);
      setHandler(
        session,
        action,
        offered ? (details) => this.dispatch(kind, details, state) : null
      );
    }
    if (info.duration && Number.isFinite(info.duration) && !info.isLiveStream) {
      try {
        session.setPositionState({
          duration: info.duration,
          position: Math.min(Math.max(info.elapsedTime ?? 0, 0), info.duration),
          playbackRate: info.playbackRate || 1,
        });
      } catch {}
    } else {
      clearPositionState(session);
    }
  }

  private dispatch(
    kind: RemoteCommandKind,
    details: MediaSessionActionDetails,
    state: NowPlayingCenterState
  ): void {
    if ((kind === 'play' || kind === 'pause') && !state.commands.has(kind)) {
      this.send({ kind: 'togglePlayPause' });
      return;
    }
    switch (kind) {
      case 'seek':
        this.send({ kind, value: details.seekTime ?? undefined });
        return;
      case 'skipForward':
        this.send({
          kind,
          value: details.seekOffset ?? state.info.skipForwardInterval,
        });
        return;
      case 'skipBackward':
        this.send({
          kind,
          value: details.seekOffset ?? state.info.skipBackwardInterval,
        });
        return;
      default:
        this.send({ kind });
    }
  }
}

function offersToggle(state: NowPlayingCenterState, kind: RemoteCommandKind): boolean {
  return (kind === 'play' || kind === 'pause') && state.commands.has('togglePlayPause');
}

function setHandler(
  session: MediaSession,
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null
): void {
  try {
    session.setActionHandler(action, handler);
  } catch {}
}

function clearPositionState(session: MediaSession): void {
  try {
    session.setPositionState();
  } catch {}
}
