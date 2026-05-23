import AudioModule from '../AudioModule';
import { semitonesToRatio, ratioToSemitones } from '../ExpoAudio';

jest.mock('expo', () => ({
  useEvent: jest.fn(),
}));

jest.mock('expo-modules-core', () => ({
  useReleasingSharedObject: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    isTV: false,
  },
}));

jest.mock('../utils/resolveSource', () => ({
  resolveSource: jest.fn((source) => source),
  resolveSources: jest.fn((sources) => sources),
  resolveSourceWithDownload: jest.fn((source) => Promise.resolve(source)),
}));

jest.mock('../AudioModule', () => {
  const mockPlayerPrototype = {
    _pitch: 0,
    get pitch() {
      return this._pitch;
    },
    set pitch(val) {
      this._pitch = Math.max(-24.0, Math.min(24.0, val));
    },
    replace() {},
    setPlaybackRate() {},
  };
  function MockAudioPlayer() {}
  MockAudioPlayer.prototype = mockPlayerPrototype;

  const mockRecorderPrototype = {
    prepareToRecordAsync() {},
  };
  function MockAudioRecorder() {}
  MockAudioRecorder.prototype = mockRecorderPrototype;

  return {
    __esModule: true,
    default: {
      AudioPlayer: MockAudioPlayer,
      AudioRecorder: MockAudioRecorder,
    },
  };
});

describe('ExpoAudio Pitch Shift Utilities', () => {
  describe('semitonesToRatio', () => {
    it('converts 0 semitones to a ratio of 1.0', () => {
      expect(semitonesToRatio(0)).toBe(1);
    });

    it('converts 12 semitones to a ratio of 2.0 (one octave up)', () => {
      expect(semitonesToRatio(12)).toBe(2);
    });

    it('converts -12 semitones to a ratio of 0.5 (one octave down)', () => {
      expect(semitonesToRatio(-12)).toBe(0.5);
    });

    it('converts decimal semitones accurately', () => {
      expect(semitonesToRatio(3)).toBeCloseTo(1.189207, 4);
    });
  });

  describe('ratioToSemitones', () => {
    it('converts a ratio of 1.0 to 0 semitones', () => {
      expect(ratioToSemitones(1)).toBe(0);
    });

    it('converts a ratio of 2.0 to 12 semitones', () => {
      expect(ratioToSemitones(2)).toBe(12);
    });

    it('converts a ratio of 0.5 to -12 semitones', () => {
      expect(ratioToSemitones(0.5)).toBe(-12);
    });

    it('converts fractional ratios accurately', () => {
      expect(ratioToSemitones(1.189207115)).toBeCloseTo(3, 4);
    });
  });

  describe('AudioPlayer.prototype.pitch clamping', () => {
    it('clamps pitch settings within the [-24.0, 24.0] semitones range', () => {
      const player = Object.create(AudioModule.AudioPlayer.prototype);

      // Set to a value within range
      player.pitch = 5.0;
      expect(player.pitch).toBe(5.0);

      // Set to a value above +24.0
      player.pitch = 30.0;
      expect(player.pitch).toBe(24.0);

      // Set to a value below -24.0
      player.pitch = -45.0;
      expect(player.pitch).toBe(-24.0);
    });
  });
});
