Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
  useReleasingSharedObjectWithLifecycle: jest.fn(() => null),
}));

const { renderHook } = require('@testing-library/react-native');

const { onHingeChange, useHingeChange } = require('../swift-ui/modifiers');

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

describe('useHingeChange', () => {
  test('returns null without a callback', async () => {
    const { result } = await renderHook(() => useHingeChange(undefined));
    expect(result.current).toBeNull();
  });

  test('falls back to a JS event listener for a plain callback', async () => {
    const handler = jest.fn();
    const { result } = await renderHook(() => useHingeChange(handler));
    expect(result.current?.$type).toBe('onHingeChange');
    expect(result.current?.workletCallback).toBeUndefined();
    result.current?.eventListener?.({
      oldContext: { hinge: null },
      newContext: { hinge: { angle: 10, status: 'closed' } },
    });
    expect(handler).toHaveBeenCalledWith(
      { hinge: null },
      { hinge: { angle: 10, status: 'closed' } }
    );
  });
});
