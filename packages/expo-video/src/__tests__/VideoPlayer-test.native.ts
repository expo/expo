import NativeVideoModule from '../ExpoVideo';
import {
  clearVideoCacheAsync,
  getCurrentVideoCacheSize,
  isPictureInPictureSupported,
} from '../VideoModule';
import { createVideoPlayer, useVideoPlayer } from '../VideoPlayer';
import VideoThumbnail from '../VideoThumbnail';
import { VideoView } from '../VideoView';

const SOURCE = 'https://example.com/video.mp4';

describe('expo-video under the jest-expo preset', () => {
  it('imports the public API without touching a real native module', () => {
    expect(typeof useVideoPlayer).toBe('function');
    expect(typeof createVideoPlayer).toBe('function');
    expect(VideoView).toBeDefined();
  });

  it('exposes every member the native module declares', () => {
    // `ExpoVideo.ts` types `ExpoVideoModule` with exactly these members.
    // A mock that silently drops one reintroduces the crash this test guards.
    expect(Object.keys(NativeVideoModule).sort()).toEqual([
      'VideoPlayer',
      'VideoThumbnail',
      'clearVideoCacheAsync',
      'getCurrentVideoCacheSize',
      'isPictureInPictureSupported',
      'setVideoCacheSizeAsync',
    ]);
  });

  it('creates a player that is recognised by `instanceof`', () => {
    const player = createVideoPlayer(SOURCE);

    // `VideoView` narrows its `player` prop with
    // `player instanceof NativeVideoModule.VideoPlayer`, so the mock has to stay
    // a real constructor rather than a plain object factory.
    expect(player).toBeInstanceOf(NativeVideoModule.VideoPlayer);
  });

  it('calls `replace` through the wrapper installed on the prototype', () => {
    const player = createVideoPlayer(SOURCE);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      player.replace('https://example.com/other.mp4', true);
      expect(warn).not.toHaveBeenCalled();

      player.replace('https://example.com/third.mp4');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('replaceAsync'));
    } finally {
      warn.mockRestore();
    }
  });

  it('calls `replaceAsync` through the wrapper installed on the prototype', async () => {
    const player = createVideoPlayer(SOURCE);
    await expect(player.replaceAsync('https://example.com/other.mp4')).resolves.toBeUndefined();
  });

  it('tracks playback state so tests can assert on it', () => {
    const player = createVideoPlayer(SOURCE);

    expect(player.playing).toBe(false);
    expect(player.keepScreenOnWhilePlaying).toBe(true);
    expect(player.showNowPlayingNotification).toBe(false);
    player.play();
    expect(player.playing).toBe(true);
    player.pause();
    expect(player.playing).toBe(false);

    player.seekBy(5);
    expect(player.currentTime).toBe(5);
    player.replay();
    expect(player.currentTime).toBe(0);
  });

  it('generates constructible thumbnails', async () => {
    const player = createVideoPlayer(SOURCE);
    const thumbnails = await player.generateThumbnailsAsync([1, 2]);

    expect(thumbnails).toHaveLength(2);
    expect(thumbnails.map((thumbnail) => thumbnail.requestedTime)).toEqual([1, 2]);
    expect(thumbnails.every((thumbnail) => thumbnail.nativeRefType === 'image')).toBe(true);

    // The preset must not wrap the class in `jest.fn()`, otherwise constructing
    // it throws "Cannot call a class as a function".
    expect(() => new VideoThumbnail()).not.toThrow();
  });

  it('exposes the module-level cache and picture-in-picture functions', async () => {
    expect(isPictureInPictureSupported()).toBe(false);
    expect(getCurrentVideoCacheSize()).toBe(0);
    await expect(clearVideoCacheAsync()).resolves.toBeUndefined();
  });

  it('emits `playingChange` from `play` and `pause`, only on actual changes', () => {
    const player = createVideoPlayer(SOURCE);
    const listener = jest.fn();
    player.addListener('playingChange', listener);

    player.play();
    expect(listener).toHaveBeenLastCalledWith({ isPlaying: true, oldIsPlaying: false });

    // Calling `play` while already playing must not emit, matching the native player.
    player.play();
    expect(listener).toHaveBeenCalledTimes(1);

    player.pause();
    expect(listener).toHaveBeenLastCalledWith({ isPlaying: false, oldIsPlaying: true });
  });

  it('emits `sourceChange` when the source is replaced', () => {
    const player = createVideoPlayer(SOURCE);
    const listener = jest.fn();
    player.addListener('sourceChange', listener);

    player.replace('https://example.com/other.mp4', true);
    expect(listener).toHaveBeenLastCalledWith({
      source: { uri: 'https://example.com/other.mp4' },
      oldSource: { uri: SOURCE },
    });
  });

  it('emits `volumeChange`, `mutedChange`, and `playbackRateChange` from the setters', () => {
    const player = createVideoPlayer(SOURCE);
    const volumeListener = jest.fn();
    const mutedListener = jest.fn();
    const rateListener = jest.fn();
    player.addListener('volumeChange', volumeListener);
    player.addListener('mutedChange', mutedListener);
    player.addListener('playbackRateChange', rateListener);

    player.volume = 0.5;
    expect(volumeListener).toHaveBeenLastCalledWith({ volume: 0.5, oldVolume: 1 });

    player.muted = true;
    expect(mutedListener).toHaveBeenLastCalledWith({ muted: true, oldMuted: false });

    player.playbackRate = 2;
    expect(rateListener).toHaveBeenLastCalledWith({ playbackRate: 2, oldPlaybackRate: 1 });

    // Assigning the current value must not emit, matching the native player.
    player.muted = true;
    expect(mutedListener).toHaveBeenCalledTimes(1);
  });

  it('exposes the documented defaults for the option objects', () => {
    const player = createVideoPlayer(SOURCE);

    expect(player.bufferOptions.waitsToMinimizeStalling).toBe(true);
    expect(player.bufferOptions.minBufferForPlayback).toBe(2);
    expect(player.seekTolerance.toleranceBefore).toBe(0);
    expect(player.seekTolerance.toleranceAfter).toBe(0);
    expect(player.scrubbingModeOptions.scrubbingModeEnabled).toBe(false);
    expect(player.scrubbingModeOptions.increaseCodecOperatingRate).toBe(true);
  });

  it('does not route `replaceAsync` through the public `replace`', async () => {
    const player = createVideoPlayer(SOURCE);
    const sourceListener = jest.fn();
    player.addListener('sourceChange', sourceListener);
    const replaceSpy = jest.spyOn(NativeVideoModule.VideoPlayer.prototype, 'replace');

    try {
      await player.replaceAsync('https://example.com/other.mp4');
      // The native module never calls `replace` from `replaceAsync`, so spies
      // on the prototype must not record a call.
      expect(replaceSpy).not.toHaveBeenCalled();
      expect(sourceListener).toHaveBeenLastCalledWith({
        source: { uri: 'https://example.com/other.mp4' },
        oldSource: { uri: SOURCE },
      });
      expect(player.currentTime).toBe(0);
    } finally {
      replaceSpy.mockRestore();
    }
  });
});
