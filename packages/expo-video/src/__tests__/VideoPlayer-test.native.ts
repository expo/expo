import NativeVideoModule from '../NativeVideoModule';
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
    // `NativeVideoModule.ts` types `ExpoVideoModule` with exactly these members.
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

    // The preset must not wrap the class in `jest.fn()`, otherwise constructing
    // it throws "Cannot call a class as a function".
    expect(() => new VideoThumbnail()).not.toThrow();
  });

  it('exposes the module-level cache and picture-in-picture functions', async () => {
    expect(isPictureInPictureSupported()).toBe(false);
    expect(getCurrentVideoCacheSize()).toBe(0);
    await expect(clearVideoCacheAsync()).resolves.toBeUndefined();
  });
});
