Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
}));

const { font } = require('../swift-ui/modifiers');

describe(font, () => {
  it('passes through the existing fixed-size system font shape', () => {
    expect(font({ size: 16, weight: 'bold', design: 'rounded' })).toEqual({
      $type: 'font',
      size: 16,
      weight: 'bold',
      design: 'rounded',
    });
  });

  it('passes through the existing custom-family fixed-size shape', () => {
    expect(font({ family: 'Helvetica', size: 18 })).toEqual({
      $type: 'font',
      family: 'Helvetica',
      size: 18,
    });
  });

  it('accepts a textStyle for Dynamic Type scaling', () => {
    expect(font({ textStyle: 'largeTitle', weight: 'bold' })).toEqual({
      $type: 'font',
      textStyle: 'largeTitle',
      weight: 'bold',
    });
  });

  it('accepts a custom family + size + textStyle for relative scaling', () => {
    expect(font({ family: 'Inter', size: 17, textStyle: 'body' })).toEqual({
      $type: 'font',
      family: 'Inter',
      size: 17,
      textStyle: 'body',
    });
  });

  it('returns an empty modifier config when no params are set', () => {
    expect(font({})).toEqual({
      $type: 'font',
    });
  });
});
