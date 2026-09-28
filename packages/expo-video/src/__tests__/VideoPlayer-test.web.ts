/** @jest-environment jsdom */
import VideoPlayerWeb from '../VideoPlayer.web';

const source = { uri: 'https://example.com/video.mp4' };

// jsdom does not implement either, and mounting a view calls both.
function createVideo(): HTMLVideoElement {
  const video = document.createElement('video');
  video.play = jest.fn(async () => {});
  video.pause = jest.fn(() => {});
  return video;
}

describe('VideoPlayerWeb', () => {
  it('ignores a video whose view has been unmounted', () => {
    const player = new VideoPlayerWeb(source);
    const video = createVideo();

    player.mountVideoView(video);
    video.dispatchEvent(new Event('play'));
    expect(player.playing).toBe(true);

    player.unmountVideoView(video);
    // Taking a media element out of the document makes the user agent pause it, so an
    // unmounted element still fires `pause`. `playing` tracks what the app asked for, and
    // a view going away is not the app asking to pause.
    video.dispatchEvent(new Event('pause'));

    expect(player.playing).toBe(true);
  });

  it('does not take the player to an error state for an unmounted video', () => {
    const player = new VideoPlayerWeb(source);
    const video = createVideo();

    player.mountVideoView(video);
    player.unmountVideoView(video);
    video.dispatchEvent(new Event('error'));

    expect(player.status).not.toBe('error');
  });

  it('listens again when the same video is remounted', () => {
    const player = new VideoPlayerWeb(source);
    const video = createVideo();

    player.mountVideoView(video);
    video.dispatchEvent(new Event('play'));
    player.unmountVideoView(video);
    player.mountVideoView(video);
    video.dispatchEvent(new Event('pause'));

    expect(player.playing).toBe(false);
  });
});
