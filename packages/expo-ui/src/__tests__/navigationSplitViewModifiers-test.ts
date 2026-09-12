Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
}));

const {
  navigationSplitViewStyle,
  navigationSplitViewColumnWidth,
} = require('../swift-ui/modifiers');

describe(navigationSplitViewStyle, () => {
  it('takes the style as a bare string, like the other style modifiers', () => {
    expect(navigationSplitViewStyle('balanced')).toEqual({
      $type: 'navigationSplitViewStyle',
      style: 'balanced',
    });
  });

  it('accepts the prominent detail style', () => {
    expect(navigationSplitViewStyle('prominentDetail')).toEqual({
      $type: 'navigationSplitViewStyle',
      style: 'prominentDetail',
    });
  });
});

describe(navigationSplitViewColumnWidth, () => {
  it('accepts a fixed width as a number, matching the SwiftUI overload', () => {
    expect(navigationSplitViewColumnWidth(260)).toEqual({
      $type: 'navigationSplitViewColumnWidth',
      width: 260,
    });
  });

  it('accepts a resizable width', () => {
    expect(navigationSplitViewColumnWidth({ min: 180, ideal: 260, max: 400 })).toEqual({
      $type: 'navigationSplitViewColumnWidth',
      min: 180,
      ideal: 260,
      max: 400,
    });
  });

  it('accepts an ideal width with no bounds', () => {
    expect(navigationSplitViewColumnWidth({ ideal: 300 })).toEqual({
      $type: 'navigationSplitViewColumnWidth',
      ideal: 300,
    });
  });
});
