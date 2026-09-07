class FakeSharedObject {
  emit() {}
}

(globalThis as any).expo = { SharedObject: FakeSharedObject };

jest.mock('expo-modules-core', () => ({
  useReleasingSharedObjectWithLifecycle: jest.fn(),
}));
jest.mock('react', () => ({ useState: jest.fn() }));
jest.mock('../resolveAssetSource', () => jest.fn());

const VideoPlayerWeb = require('../VideoPlayer.web').default;

const listenerProperties = [
  'onplay',
  'onpause',
  'onvolumechange',
  'onseeking',
  'onseeked',
  'onratechange',
  'onerror',
  'oncanplay',
  'onwaiting',
  'onended',
  'onloadstart',
] as const;

function createVideo(): HTMLVideoElement {
  return {
    preservesPitch: true,
    loop: false,
    volume: 1,
    muted: false,
    playbackRate: 1,
    paused: false,
    currentTime: 0,
    readyState: 4,
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    ...Object.fromEntries(listenerProperties.map((property) => [property, null])),
  } as unknown as HTMLVideoElement;
}

describe('VideoPlayerWeb listener lifecycle', () => {
  it('ignores events from a video view after it unmounts', () => {
    const player = new VideoPlayerWeb(null);
    const unmountedVideo = createVideo();
    const mountedVideo = createVideo();

    player.mountVideoView(unmountedVideo);
    player.mountVideoView(mountedVideo);
    (mountedVideo.pause as jest.Mock).mockClear();

    player.unmountVideoView(unmountedVideo);
    unmountedVideo.onpause?.({ target: unmountedVideo } as unknown as Event);

    expect(mountedVideo.pause).not.toHaveBeenCalled();
  });

  it('clears every DOM event handler owned by the player', () => {
    const player = new VideoPlayerWeb(null);
    const video = createVideo();

    player.mountVideoView(video);
    for (const property of listenerProperties) {
      expect(video[property]).toEqual(expect.any(Function));
    }

    player.unmountVideoView(video);
    for (const property of listenerProperties) {
      expect(video[property]).toBeNull();
    }
  });
});
