const { requireNativeModule } = require('expo-modules-core');

describe('generated native module mock events', () => {
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
});
