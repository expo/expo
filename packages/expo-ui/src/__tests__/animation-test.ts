Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
}));

const { animation, Animation } = require('../swift-ui/modifiers');

describe(animation, () => {
  it('passes the chained animation to native', () => {
    const chained = Animation.easeInOut({ duration: 1 })
      .delay(0.5)
      .repeat({ repeatCount: 3, autoreverses: true });

    expect(animation(chained, true)).toEqual({
      $type: 'animation',
      animation: {
        type: 'easeInOut',
        duration: 1,
        delay: 0.5,
        repeatCount: 3,
        autoreverses: true,
      },
      animatedValue: true,
    });
  });

  it('leaves the animation that delay is called on unchanged', () => {
    const base = Animation.easeInOut({ duration: 1 });
    base.delay(0.5);

    expect(animation(base, true)).toEqual({
      $type: 'animation',
      animation: { type: 'easeInOut', duration: 1 },
      animatedValue: true,
    });
  });

  it('leaves the animation that repeat is called on unchanged', () => {
    const base = Animation.easeInOut({ duration: 1 });
    base.repeat({ repeatCount: 3, autoreverses: true });

    expect(animation(base, true)).toEqual({
      $type: 'animation',
      animation: { type: 'easeInOut', duration: 1 },
      animatedValue: true,
    });
  });

  it('keeps Animation.default unchanged after chaining from it', () => {
    Animation.default.delay(0.3);

    expect(animation(Animation.default, true)).toEqual({
      $type: 'animation',
      animation: { type: 'default' },
      animatedValue: true,
    });
  });
});

describe('Animation spring presets', () => {
  const presets = ['smooth', 'snappy', 'bouncy'];

  it.each(presets)('passes %s without parameters to native', (preset) => {
    expect(animation(Animation[preset](), true)).toEqual({
      $type: 'animation',
      animation: { type: preset },
      animatedValue: true,
    });
  });

  it.each(presets)('passes the duration and extra bounce of %s to native', (preset) => {
    expect(animation(Animation[preset]({ duration: 0.4, extraBounce: 0.1 }), true)).toEqual({
      $type: 'animation',
      animation: { type: preset, duration: 0.4, extraBounce: 0.1 },
      animatedValue: true,
    });
  });
});
