let checked = false;

// Feedback is user content, so the app privacy manifest should declare it. Checks one time.
export function warnIfUserContentEntryMissing(native: object): void {
  if (checked) {
    return;
  }
  checked = true;
  // `ObserveModule` does not declare this iOS-only function. Binaries built before this version
  // do not have it.
  if (
    (native as { hasUserContentPrivacyEntry?(): boolean }).hasUserContentPrivacyEntry?.() === false
  ) {
    console.warn(
      '[expo-observe] The app privacy manifest declares no user content, which `Observe.reportFeedback` sends. ' +
        'Add an `NSPrivacyCollectedDataTypeOtherUserContent` entry to `NSPrivacyCollectedDataTypes`, ' +
        "unless the feedback meets all of Apple's criteria for optional disclosure. " +
        'See https://docs.expo.dev/eas/observe/feedback/#privacy-manifest-entry'
    );
  }
}
