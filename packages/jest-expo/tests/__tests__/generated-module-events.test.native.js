const { requireNativeModule } = require('expo-modules-core');

describe('generated native module mock events', () => {
  afterEach(() => {
    delete globalThis.expo.modules?.TestEventsModule;
  });

  it('returns a subscription from addListener that delivers and stops events', () => {
    const nativeModule = requireNativeModule('ExpoNotificationsHandlerModule');
    const listener = jest.fn();

    const subscription = nativeModule.addListener('onHandleNotification', listener);
    nativeModule.emit('onHandleNotification', { id: '1' });
    subscription.remove();
    nativeModule.emit('onHandleNotification', { id: '2' });

    expect(nativeModule.addListener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ id: '1' });
  });

  it('keeps a custom addListener from globalThis.expo.modules', () => {
    const addListener = jest.fn(() => 'custom');
    globalThis.expo.modules ??= {};
    globalThis.expo.modules.TestEventsModule = { addListener };

    expect(requireNativeModule('TestEventsModule').addListener()).toBe('custom');
    expect(addListener).toHaveBeenCalledTimes(1);
  });
});
