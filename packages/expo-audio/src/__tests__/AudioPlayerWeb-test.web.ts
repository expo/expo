/**
 * @jest-environment jsdom
 */
class FakeSharedObject {
  events: { name: string; payload: any }[] = [];
  emit(name: string, payload: any) {
    this.events.push({ name, payload });
  }
  addListener() {}
  removeListener() {}
}

(globalThis as any).expo = { SharedObject: FakeSharedObject };

const { AudioPlayerWeb } = require('../AudioPlayer.web');
const { AudioPlaylistWeb } = require('../AudioPlaylist.web');

const blocked = new DOMException(
  'play() failed because the user did not interact',
  'NotAllowedError'
);

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('when the browser blocks playback', () => {
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => unhandled.push(reason);

  beforeEach(() => {
    unhandled.length = 0;
    process.on('unhandledRejection', onUnhandled);
    jest
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementation(() => Promise.reject(blocked));
    jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  });

  afterEach(() => {
    process.off('unhandledRejection', onUnhandled);
    jest.restoreAllMocks();
  });

  it('AudioPlayer handles the rejection and is not playing', async () => {
    const player = new AudioPlayerWeb('https://example.com/a.mp3');

    player.play();
    await flushPromises();

    expect(unhandled).toEqual([]);
    expect(player.playing).toBe(false);
  });

  it('AudioPlayer reports the rejection in a status update', async () => {
    const player = new AudioPlayerWeb('https://example.com/a.mp3');

    player.play();
    await flushPromises();

    expect(player.events.at(-1)).toEqual({
      name: 'playbackStatusUpdate',
      payload: expect.objectContaining({ playing: false, error: blocked.message }),
    });
  });

  it('AudioPlayer does not report an error when pause interrupts play', async () => {
    const interrupted = new DOMException('The play() request was interrupted', 'AbortError');
    jest
      .mocked(HTMLMediaElement.prototype.play)
      .mockImplementation(() => Promise.reject(interrupted));
    const player = new AudioPlayerWeb('https://example.com/a.mp3');

    player.play();
    player.pause();
    await flushPromises();

    expect(unhandled).toEqual([]);
    expect(player.events.some(({ payload }: any) => payload?.error)).toBe(false);
  });

  it('AudioPlaylist handles the rejection and is not playing', async () => {
    const playlist = new AudioPlaylistWeb(['https://example.com/a.mp3']);

    playlist.play();
    await flushPromises();

    expect(unhandled).toEqual([]);
    expect(playlist.playing).toBe(false);
    expect(playlist.events.at(-1)?.payload).toEqual(expect.objectContaining({ playing: false }));
  });
});

describe('when the player seeks during playback', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AudioPlayer reports playing after a seek to the start', () => {
    jest.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(false);
    const player = new AudioPlayerWeb('https://example.com/a.mp3');

    player.media.dispatchEvent(new Event('seeked'));

    expect(player.events.at(-1)).toEqual({
      name: 'playbackStatusUpdate',
      payload: expect.objectContaining({ playing: true, currentTime: 0 }),
    });
  });
});

describe('isActiveForLockScreen', () => {
  const players: { release(): void }[] = [];
  const createPlayer = () => {
    const player = new AudioPlayerWeb('https://example.com/a.mp3');
    players.push(player);
    return player;
  };

  beforeEach(() => {
    jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  });

  afterEach(() => {
    // The media session controller is shared, so the active player is cleared between tests
    players.splice(0).forEach((player) => player.release());
    delete (navigator as any).mediaSession;
    delete (globalThis as any).MediaMetadata;
    jest.restoreAllMocks();
  });

  describe('when the browser supports the Media Session API', () => {
    beforeEach(() => {
      // jsdom does not implement the Media Session API
      Object.defineProperty(navigator, 'mediaSession', {
        configurable: true,
        value: {
          metadata: null,
          playbackState: 'none',
          setActionHandler: jest.fn(),
          setPositionState: jest.fn(),
        },
      });
      (globalThis as any).MediaMetadata = class {};
    });

    it('follows setActiveForLockScreen() and clearLockScreenControls()', () => {
      const player = createPlayer();

      player.setActiveForLockScreen(true);
      expect(player.isActiveForLockScreen).toBe(true);

      player.clearLockScreenControls();
      expect(player.isActiveForLockScreen).toBe(false);
    });

    it('is false after another player becomes active', () => {
      const first = createPlayer();
      const second = createPlayer();
      first.setActiveForLockScreen(true);

      second.setActiveForLockScreen(true);

      expect(first.isActiveForLockScreen).toBe(false);
      expect(second.isActiveForLockScreen).toBe(true);
    });
  });

  describe('when the browser does not support the Media Session API', () => {
    it('stays false after setActiveForLockScreen(true)', () => {
      const player = createPlayer();

      player.setActiveForLockScreen(true);

      expect(player.isActiveForLockScreen).toBe(false);
    });
  });
});
