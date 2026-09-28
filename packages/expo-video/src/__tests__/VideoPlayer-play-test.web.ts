/** @jest-environment jsdom */
import VideoPlayerWeb from '../VideoPlayer.web';

const source = { uri: 'https://example.com/video.mp4' };

function createVideo(playResult: () => Promise<void>): HTMLVideoElement {
  const video = document.createElement('video');
  video.play = jest.fn(playResult);
  video.pause = jest.fn(() => {});
  return video;
}

function rejectWith(name: string) {
  return async () => {
    const error = new Error(name);
    error.name = name;
    throw error;
  };
}

describe('VideoPlayerWeb.play() rejections', () => {
  it('reconciles and reports when the browser refuses to play', async () => {
    const player = new VideoPlayerWeb(source);
    const video = createVideo(rejectWith('NotAllowedError'));
    player.mountVideoView(video);

    const events: { isPlaying: boolean }[] = [];
    player.addListener('playingChange', (event) => events.push(event));

    // The player reports what it was asked for until the promise settles.
    player.playing = true;
    player.play();
    await Promise.resolve();
    await Promise.resolve();

    expect(player.playing).toBe(false);
    expect(events).toContainEqual(expect.objectContaining({ isPlaying: false }));
  });

  it('leaves the player alone when a newer command supersedes the play', async () => {
    const player = new VideoPlayerWeb(source);
    const video = createVideo(rejectWith('AbortError'));
    player.mountVideoView(video);

    player.playing = true;
    player.play();
    await Promise.resolve();
    await Promise.resolve();

    // A newer load() or pause() caused this. Its own events describe the real state.
    expect(player.playing).toBe(true);
  });

  it('does nothing when play resolves', async () => {
    const player = new VideoPlayerWeb(source);
    const video = createVideo(async () => {});
    player.mountVideoView(video);

    player.playing = true;
    player.play();
    await Promise.resolve();
    await Promise.resolve();

    expect(player.playing).toBe(true);
  });
});
