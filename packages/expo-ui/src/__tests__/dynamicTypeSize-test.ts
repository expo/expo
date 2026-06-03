Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
}));

const { dynamicTypeSize } = require('../swift-ui/modifiers');

describe(dynamicTypeSize, () => {
  it('fixes the size to a single value', () => {
    expect(dynamicTypeSize('large')).toEqual({
      $type: 'dynamicTypeSize',
      size: 'large',
    });
  });

  it('caps growth with a max only (partial range)', () => {
    expect(dynamicTypeSize({ max: 'accessibility3' })).toEqual({
      $type: 'dynamicTypeSize',
      max: 'accessibility3',
    });
  });

  it('sets a floor with a min only (partial range)', () => {
    expect(dynamicTypeSize({ min: 'large' })).toEqual({
      $type: 'dynamicTypeSize',
      min: 'large',
    });
  });

  it('clamps to a closed range with both bounds', () => {
    expect(dynamicTypeSize({ min: 'large', max: 'accessibility3' })).toEqual({
      $type: 'dynamicTypeSize',
      min: 'large',
      max: 'accessibility3',
    });
  });
});
