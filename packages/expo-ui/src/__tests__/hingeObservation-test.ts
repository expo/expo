Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
}));

const { onHingeChange } = require('../swift-ui/modifiers');

describe(onHingeChange, () => {
  test('creates an onHingeChange modifier with an event listener', () => {
    const modifier = onHingeChange(jest.fn());
    expect(modifier.$type).toBe('onHingeChange');
    expect(typeof modifier.eventListener).toBe('function');
  });

  test('passes the old and new context to the handler', () => {
    const handler = jest.fn();
    const oldContext = { hinge: null };
    const newContext = { hinge: { angle: 90, status: 'partiallyOpen' } };
    onHingeChange(handler).eventListener?.({ oldContext, newContext });
    expect(handler).toHaveBeenCalledWith(oldContext, newContext);
  });
});
