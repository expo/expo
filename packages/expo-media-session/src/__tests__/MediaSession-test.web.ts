import {
  getAudioPolicy,
  getNowPlayingOwnerId,
  offerNowPlaying,
  setAudioPolicyAsync,
} from '../MediaSession';
import type {
  InterruptionMode,
  NowPlayingOwner,
  RemoteCommand,
  RemoteCommandKind,
} from '../MediaSession.types';
import { type NowPlayingCenterState, NowPlayingStack } from '../web/NowPlayingStack';

type OwnerEvent = 'pausedForTakeover' | 'resumedAfterTakeover' | RemoteCommand;

class FakeOwner implements NowPlayingOwner {
  events: OwnerEvent[] = [];
  handled = 0;

  constructor(
    readonly nowPlayingId: string,
    public isPlaying = true,
    readonly mediaType: 'audio' | 'video' = 'audio'
  ) {}

  handle(command: RemoteCommand): boolean {
    this.handled += 1;
    this.events.push(command);
    return true;
  }

  pauseForTakeover(): void {
    this.isPlaying = false;
    this.events.push('pausedForTakeover');
  }

  resumeAfterTakeover(): void {
    this.isPlaying = true;
    this.events.push('resumedAfterTakeover');
  }
}

class FakeCenter {
  state: NowPlayingCenterState | null = null;
  send: (command: RemoteCommand) => void = () => {};

  setCommandHandler(handler: (command: RemoteCommand) => void) {
    this.send = handler;
  }

  apply(state: NowPlayingCenterState | null) {
    this.state = state;
  }
}

const playback: RemoteCommandKind[] = ['play', 'pause', 'togglePlayPause'];

function makeStack(mode: InterruptionMode = 'doNotMix') {
  const center = new FakeCenter();
  return { center, stack: new NowPlayingStack(center, () => mode) };
}

describe('webNowPlayingStackMatchesNative', () => {
  it('video takes over and the podcast returns resumed', () => {
    const { center, stack } = makeStack();
    const podcast = new FakeOwner('podcast');
    const video = new FakeOwner('video', true, 'video');
    stack.offer(podcast, { title: 'Podcast' }, playback);
    const videoClaim = stack.offer(video, { title: 'Video' }, ['play', 'pause']);

    expect(podcast.events).toEqual(['pausedForTakeover']);
    expect(center.state?.info.title).toBe('Video');
    expect([...center.state!.commands]).toEqual(['play', 'pause']);

    videoClaim.withdraw('ended');

    expect(podcast.events).toEqual(['pausedForTakeover', 'resumedAfterTakeover']);
    expect(center.state?.info.title).toBe('Podcast');
    expect(stack.ownerId).toBe('podcast');
  });

  it('a user-paused owner returns paused', () => {
    const { center, stack } = makeStack();
    const podcast = new FakeOwner('podcast', false);
    stack.offer(podcast, { title: 'Podcast' }, playback);
    stack.offer(new FakeOwner('video'), { title: 'Video' }, playback).withdraw('ended');

    expect(stack.ownerId).toBe('podcast');
    expect(podcast.events).toEqual([]);
    expect(center.state?.isPlaying).toBe(false);
  });

  it('a pause keeps ownership', () => {
    const { center, stack } = makeStack();
    const podcast = new FakeOwner('podcast');
    const video = new FakeOwner('video');
    stack.offer(podcast, { title: 'Podcast' }, playback);
    const videoClaim = stack.offer(video, { title: 'Video' }, playback);

    video.isPlaying = false;
    videoClaim.update({ title: 'Video', elapsedTime: 12 });

    expect(stack.ownerId).toBe('video');
    expect(center.state?.isPlaying).toBe(false);
    expect(podcast.events).toEqual(['pausedForTakeover']);
  });

  it('a released owner below the top is skipped', () => {
    const { center, stack } = makeStack();
    const a = new FakeOwner('a');
    const b = new FakeOwner('b');
    const c = new FakeOwner('c');
    stack.offer(a, { title: 'A' }, playback);
    const bClaim = stack.offer(b, { title: 'B' }, playback);
    const cClaim = stack.offer(c, { title: 'C' }, playback);

    bClaim.withdraw('released');
    cClaim.withdraw('ended');

    expect(stack.ownerId).toBe('a');
    expect(center.state?.info.title).toBe('A');
    expect(a.events).toEqual(['pausedForTakeover', 'resumedAfterTakeover']);
    expect(b.events).toEqual(['pausedForTakeover']);
  });

  it('mixWithOthers does not pause the previous owner', () => {
    const { stack } = makeStack('mixWithOthers');
    const podcast = new FakeOwner('podcast');
    stack.offer(podcast, { title: 'Podcast' }, playback);
    const videoClaim = stack.offer(new FakeOwner('video'), { title: 'Video' }, playback);

    expect(stack.ownerId).toBe('video');
    expect(podcast.isPlaying).toBe(true);
    videoClaim.withdraw('ended');
    expect(podcast.events).toEqual([]);
  });

  it('a command routes only to the top', () => {
    const { center, stack } = makeStack();
    const owners = ['a', 'b', 'c'].map((id) => new FakeOwner(id));
    owners.forEach((owner) => stack.offer(owner, { title: owner.nowPlayingId }, playback));

    center.send({ kind: 'togglePlayPause' });

    expect(owners.map((owner) => owner.handled)).toEqual([0, 0, 1]);
    expect(owners[2]!.events.at(-1)).toEqual({ kind: 'togglePlayPause' });
  });
});

describe('web module', () => {
  const handlers = new Map<string, ((details: object) => void) | null>();

  beforeAll(() => {
    (globalThis as any).MediaMetadata = class {
      constructor(init: object) {
        Object.assign(this, init);
      }
    };
    Object.defineProperty(navigator, 'mediaSession', {
      configurable: true,
      value: {
        metadata: null,
        playbackState: 'none',
        setActionHandler: (action: string, handler: ((details: object) => void) | null) =>
          handlers.set(action, handler),
        setPositionState: jest.fn(),
      },
    });
  });

  it('setAudioPolicyAsyncMergesPartialUpdate', async () => {
    await setAudioPolicyAsync({
      interruptionMode: 'doNotMix',
      allowsRecording: undefined,
    });

    expect(getAudioPolicy()).toStrictEqual({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
  });

  it('webSetsMediaSessionMetadataForTop', () => {
    const podcast = new FakeOwner('podcast');
    const video = new FakeOwner('video', true, 'video');
    offerNowPlaying(podcast, { title: 'Podcast', artist: 'Host' }, playback);
    const videoClaim = offerNowPlaying(video, { title: 'Video', duration: 60 }, ['play', 'seek']);

    expect(navigator.mediaSession.metadata).toMatchObject({
      title: 'Video',
      artist: '',
    });
    expect(navigator.mediaSession.playbackState).toBe('playing');
    expect(getNowPlayingOwnerId()).toBe('video');
    expect(handlers.get('nexttrack')).toBeNull();

    handlers.get('seekto')!({ action: 'seekto', seekTime: 30 });
    expect(video.events).toEqual([{ kind: 'seek', value: 30 }]);

    videoClaim.withdraw('ended');

    expect(navigator.mediaSession.metadata).toMatchObject({
      title: 'Podcast',
      artist: 'Host',
    });
    expect(getNowPlayingOwnerId()).toBe('podcast');
    handlers.get('pause')!({ action: 'pause' });
    expect(podcast.events.at(-1)).toEqual({ kind: 'pause' });
  });
});
