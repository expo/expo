Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
}));

const { aspectRatio } = require('../swift-ui/modifiers');

describe(aspectRatio, () => {
  it('accepts an explicit ratio', () => {
    expect(aspectRatio({ ratio: 2, contentMode: 'fill' })).toEqual({
      $type: 'aspectRatio',
      ratio: 2,
      contentMode: 'fill',
    });
  });

  it('allows omitting the ratio to use the intrinsic aspect ratio', () => {
    expect(aspectRatio({ contentMode: 'fit' })).toEqual({
      $type: 'aspectRatio',
      contentMode: 'fit',
    });
  });
});
