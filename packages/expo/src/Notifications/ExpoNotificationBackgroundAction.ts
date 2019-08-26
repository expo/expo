import { NativeModulesProxy, UnavailabilityError } from '@unimodules/core';
if (!NativeModulesProxy.ExpoNotificationBackgroundAction) {
  throw new UnavailabilityError('Expo.Notifications', 'ExpoNotificationBackgroundAction');
}
export default NativeModulesProxy.ExpoNotificationBackgroundAction;
