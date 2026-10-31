Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
}));

const { clipShape, shapes } = require('../swift-ui/modifiers');

describe(clipShape, () => {
  it('passes the corner style of a rounded rectangle from the shapes API', () => {
    expect(
      clipShape(shapes.roundedRectangle({ cornerRadius: 16, roundedCornerStyle: 'circular' }))
    ).toEqual({
      $type: 'clipShape',
      shape: 'roundedRectangle',
      cornerRadius: 16,
      roundedCornerStyle: 'circular',
      cornerSize: undefined,
    });
  });
});
