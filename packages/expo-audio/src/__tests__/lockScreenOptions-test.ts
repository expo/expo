import { normalizeLockScreenOptions } from '../utils/lockScreenOptions';

describe(normalizeLockScreenOptions, () => {
  it('defaults both intervals to 10 seconds when no options are provided', () => {
    expect(normalizeLockScreenOptions(undefined)).toEqual({
      seekForwardIntervalSeconds: 10,
      seekBackwardIntervalSeconds: 10,
    });
  });

  it('defaults both intervals to 10 seconds when the options omit them', () => {
    expect(normalizeLockScreenOptions({ showSeekForward: true })).toEqual({
      showSeekForward: true,
      seekForwardIntervalSeconds: 10,
      seekBackwardIntervalSeconds: 10,
    });
  });

  it('preserves the other lock screen options', () => {
    const options = {
      showSeekForward: true,
      showSeekBackward: true,
      showNextTrack: true,
      showPreviousTrack: false,
      isLiveStream: true,
    };
    expect(normalizeLockScreenOptions(options)).toMatchObject(options);
  });

  it('keeps valid custom intervals untouched', () => {
    expect(
      normalizeLockScreenOptions({
        seekForwardIntervalSeconds: 30,
        seekBackwardIntervalSeconds: 15.5,
      })
    ).toMatchObject({
      seekForwardIntervalSeconds: 30,
      seekBackwardIntervalSeconds: 15.5,
    });
  });

  it('clamps intervals below the minimum to 0.1 seconds', () => {
    expect(
      normalizeLockScreenOptions({
        seekForwardIntervalSeconds: 0,
        seekBackwardIntervalSeconds: -5,
      })
    ).toMatchObject({
      seekForwardIntervalSeconds: 0.1,
      seekBackwardIntervalSeconds: 0.1,
    });
  });

  it('falls back to the default for non-finite intervals', () => {
    expect(
      normalizeLockScreenOptions({
        seekForwardIntervalSeconds: Number.NaN,
        seekBackwardIntervalSeconds: Number.POSITIVE_INFINITY,
      })
    ).toMatchObject({
      seekForwardIntervalSeconds: 10,
      seekBackwardIntervalSeconds: 10,
    });
  });

  it('does not mutate the options that were passed in', () => {
    const options = { seekForwardIntervalSeconds: 0 };
    normalizeLockScreenOptions(options);
    expect(options).toEqual({ seekForwardIntervalSeconds: 0 });
  });
});
