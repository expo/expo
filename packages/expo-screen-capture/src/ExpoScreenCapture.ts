import { requireNativeModule } from 'expo-modules-core';
export default requireNativeModule('ExpoScreenCapture');

export interface ExpoScreenCaptureModule {
  // ... existing properties ...
  addListener(eventName: 'onScreenshot', listener: () => void): Subscription;
  addListener(
    eventName: 'onRecording',
    listener: (event: { isRecording: boolean }) => void
  ): Subscription;
}
