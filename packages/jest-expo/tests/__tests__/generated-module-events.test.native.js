const { NativeModulesProxy, requireNativeModule } = require('expo-modules-core');

describe('generated native module mock events', () => {
  const generatedAddListener = NativeModulesProxy.ExpoNotificationsEmitter.addListener;
  const generatedImplementation = generatedAddListener.getMockImplementation();

  afterEach(() => {
    delete globalThis.expo.modules?.TestEventsModule;
    generatedAddListener.mockReset();
    generatedAddListener.mockImplementation(generatedImplementation);
  });

  it('returns a subscription from addListener that delivers and stops events', () => {
    const nativeModule = requireNativeModule('ExpoNotificationsHandlerModule');
    const listener = jest.fn();

    const subscription = nativeModule.addListener('onHandleNotification', listener);
    nativeModule.emit('onHandleNotification', { id: '1' });
    subscription.remove();
    nativeModule.emit('onHandleNotification', { id: '2' });

    expect(nativeModule.addListener).toHaveBeenCalledTimes(1);
    expect(NativeModulesProxy.ExpoNotificationsHandlerModule.addListener).toHaveBeenCalledWith(
      'onHandleNotification',
      listener
    );
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

  it('uses a return value set on the generated addListener after require', () => {
    const nativeModule = requireNativeModule('ExpoNotificationsEmitter');
    generatedAddListener.mockReturnValue('custom');

    expect(nativeModule.addListener('onNotificationReceived', jest.fn())).toBe('custom');
    expect(generatedAddListener).toHaveBeenCalledTimes(1);
  });

  it('uses a one time return value set on the generated addListener before require', () => {
    generatedAddListener.mockReturnValueOnce('custom');
    const nativeModule = requireNativeModule('ExpoNotificationsEmitter');

    expect(nativeModule.addListener('onNotificationReceived', jest.fn())).toBe('custom');
    expect(nativeModule.addListener('onNotificationReceived', jest.fn())).toEqual({
      remove: expect.any(Function),
    });
    expect(generatedAddListener).toHaveBeenCalledTimes(2);
  });

  it('resolves count only addListener calls without registering a listener', async () => {
    const nativeModule = requireNativeModule('ExpoNotificationsEmitter');

    await expect(
      NativeModulesProxy.ExpoNotificationsEmitter.addListener('onNotificationReceived')
    ).resolves.toBeUndefined();
    await expect(nativeModule.addListener('onNotificationReceived')).resolves.toBeUndefined();
    expect(nativeModule.listenerCount('onNotificationReceived')).toBe(0);
  });
});
