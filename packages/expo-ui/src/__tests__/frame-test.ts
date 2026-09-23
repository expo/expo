Object.defineProperty(globalThis, '__DEV__', {
  value: true,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
}));

const { frame } = require('../swift-ui/modifiers') as typeof import('../swift-ui/modifiers');

describe(frame, () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('passes a fixed frame through', () => {
    expect(frame({ width: 100, height: 50, alignment: 'leading' })).toEqual({
      $type: 'frame',
      width: 100,
      height: 50,
      alignment: 'leading',
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('passes a flexible frame through', () => {
    expect(frame({ maxWidth: Infinity, minHeight: 50 })).toEqual({
      $type: 'frame',
      maxWidth: Infinity,
      minHeight: 50,
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('rejects fixed and flexible values in one call', () => {
    // @ts-expect-error SwiftUI has no frame overload that takes both kinds of value.
    frame({ maxWidth: Infinity, height: 50 });
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
