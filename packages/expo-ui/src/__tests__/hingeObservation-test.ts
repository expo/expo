Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
  useReleasingSharedObjectWithLifecycle: jest.fn(() => null),
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

  test('passes a worklet callback to native by its shared object id', () => {
    const workletCallback = { __expo_shared_object_id__: 7 };
    const modifier = onHingeChange(workletCallback);
    expect(modifier).toEqual({ $type: 'onHingeChange', workletCallback: 7 });
    expect(modifier.eventListener).toBeUndefined();
  });
});
