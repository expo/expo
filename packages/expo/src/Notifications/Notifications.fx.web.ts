import { NativeEventEmitter } from 'react-native';

export const _notificationEmitter = new NativeEventEmitter();
export const _notificationEmitterEventName = 'webReceivedNotification';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.addEventListener('message', event => {
      _notificationEmitter.emit(_notificationEmitterEventName, event.data);
    });
  });
}
