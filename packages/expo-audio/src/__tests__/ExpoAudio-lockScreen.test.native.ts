import AudioModule from '../AudioModule';
import '../ExpoAudio';

jest.mock('../AudioModule', () => {
  const nativePlayerSetActiveForLockScreen = jest.fn();
  const nativePlaylistSetActiveForLockScreen = jest.fn();
  class AudioPlayer {}
  class AudioPlaylist {}
  class AudioRecorder {}
  // Methods live on the prototype so the shims in ExpoAudio.ts can wrap them.
  Object.assign(AudioPlayer.prototype, {
    replace: jest.fn(),
    setPlaybackRate: jest.fn(),
    setActiveForLockScreen: nativePlayerSetActiveForLockScreen,
  });
  Object.assign(AudioPlaylist.prototype, {
    setActiveForLockScreen: nativePlaylistSetActiveForLockScreen,
  });
  Object.assign(AudioRecorder.prototype, { prepareToRecordAsync: jest.fn() });
  return {
    __esModule: true,
    default: { AudioPlayer, AudioPlaylist, AudioRecorder },
    nativePlayerSetActiveForLockScreen,
    nativePlaylistSetActiveForLockScreen,
  };
});

jest.mock('expo', () => ({
  useEvent: jest.fn(),
  useReleasingSharedObject: jest.fn(),
}));

const { nativePlayerSetActiveForLockScreen, nativePlaylistSetActiveForLockScreen } =
  jest.requireMock('../AudioModule');

describe('setActiveForLockScreen normalizes skip intervals before reaching native', () => {
  beforeEach(() => {
    nativePlayerSetActiveForLockScreen.mockClear();
    nativePlaylistSetActiveForLockScreen.mockClear();
  });

  it('defaults and clamps intervals for AudioPlayer', () => {
    const player = new (AudioModule.AudioPlayer as any)();
    const metadata = { title: 'Song' };
    player.setActiveForLockScreen(true, metadata, {
      showSeekForward: true,
      seekForwardIntervalSeconds: 0,
    });

    expect(nativePlayerSetActiveForLockScreen).toHaveBeenCalledWith(true, metadata, {
      showSeekForward: true,
      seekForwardIntervalSeconds: 0.1,
      seekBackwardIntervalSeconds: 10,
    });
  });

  it('defaults and clamps intervals for AudioPlaylist', () => {
    const playlist = new (AudioModule.AudioPlaylist as any)();
    playlist.setActiveForLockScreen(true, undefined, { seekBackwardIntervalSeconds: -3 });

    expect(nativePlaylistSetActiveForLockScreen).toHaveBeenCalledWith(true, undefined, {
      seekForwardIntervalSeconds: 10,
      seekBackwardIntervalSeconds: 0.1,
    });
  });

  it('passes options through untouched when deactivating without options', () => {
    const player = new (AudioModule.AudioPlayer as any)();
    player.setActiveForLockScreen(false);

    expect(nativePlayerSetActiveForLockScreen).toHaveBeenCalledWith(false, undefined, undefined);
  });
});
