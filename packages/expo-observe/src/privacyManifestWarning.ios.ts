import { requireNativeModule } from 'expo';

let checked = false;

// Feedback is user content, so the app privacy manifest should declare it. Checks one time.
export function warnIfUserContentEntryMissing(): void {
  if (checked) {
    return;
  }
  checked = true;
  // The function is missing in binaries built before this version.
  const native = requireNativeModule<{ hasUserContentPrivacyEntry?(): boolean }>('ExpoObserve');
  if (native.hasUserContentPrivacyEntry?.() === false) {
    console.warn(
      '[expo-observe] The app privacy manifest declares no user content, which `Observe.reportFeedback` sends. ' +
        'Add an `NSPrivacyCollectedDataTypeOtherUserContent` entry to `NSPrivacyCollectedDataTypes`, ' +
        "unless the feedback meets all of Apple's criteria for optional disclosure. " +
        'See https://docs.expo.dev/eas/observe/feedback/#privacy-manifest-entry'
    );
  }
}
