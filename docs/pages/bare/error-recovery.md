---
title: Error Recovery
sidebar_title: Error Recovery
---

Apps using `expo-updates` can take advantage of built-in error recovery behavior as an extra safeguard against accidentally publishing broken updates.

While we cannot stress enough the importance of testing updates in a staging environment before publishing to production, humans (and even computers) occasionally make mistakes, and the error recovery behavior described here can serve as a last resort in such cases.

> Disclaimer: the behavior documented below is subject to change and should not be relied upon. Always test your code carefully and thoroughly in production-like environments before publishing updates.

> The behavior documented on this page applies to bare apps as well as apps built with EAS Build, **not** apps built with `expo build:ios` or `expo build:android` (which have a separate error recovery mechanism that uses [`expo-error-recovery`](/versions/latest/sdk/error-recovery)).

## Help! I published a broken update to production. What should I do?

First of all, don't panic. Mistakes happen; most likely, everything will be fine.

The important thing is to **publish a new update with a fix as soon as possible (though not before you are 100% confident in your fix).** The error recovery mechanism in `expo-updates` will ensure that in most cases, even users who have already downloaded the broken update should be able to get the fix.

The first thing to try is rolling back to an older update that you know was working. **However, this may not always be safe;** your broken update may, for example, have modified persistent state (such as data stored in AsyncStorage or on the device's file system) in a non-backwards-compatible way. It's important to test in a staging environment that emulates an end user's device state as closely as possible—i.e. load the broken update and then roll back.

If you can identify an older update that is safe to roll back to, you can do so using [EAS Update's `republish` option](/eas-update/eas-update-and-eas-cli/#republish-a-previous-update-within-a-branch). If you're using classic Expo-hosted updates (`expo publish`) or hosting your updates on your own server, you'll need to publish a new update with your old code in order to generate an update with a new ID and publish date.

If you cannot identify an older update that is safe to roll back to, you'll need to fix forward. While it's best to roll out a fix as quickly as possible, you should take the time to ensure your fix is solid, and know that even users who download your broken update in the meantime should be able to download your fix.

If you'd like more details about how this works, read on.

## Explaining the error recovery flow

The error recovery flow is intended to be as lightweight as possible. It is not a full safety net that protects your end users from the results of errors; in many cases users will still see a crash.

Rather, the purpose is to prevent updates from "bricking" your app (causing a crash on launch before the app can check for updates, making the app unusable until uninstalled and reinstalled) by ensuring that in as many cases as possible, the app has the opportunity to download a new update and fix itself.

### Catching an error

If your app throws a fatal error when executing JS which is early enough in the app's lifecycle that it may prevent the app from being able to download further updates, `expo-updates` will catch this error.

> If more than 10 seconds have elapsed between your app's first render and the time a fatal error is thrown, `expo-updates` will not catch this error at all and none of the error recovery code will be triggered. Therefore, we highly recommend that your app check for updates very shortly after launching, whether [automatically](/bare/updating-your-app/#automatic-updates) or [manually](/bare/updating-your-app/#manual-updates) to ensure you can push out fixes in the event of a future error.

If `expo-updates` catches a JS error, what will happen next depends on whether React Native has fired the native "content appeared" event (`RCTContentDidAppearNotification` on iOS, or `ReactMarkerConstants.CONTENT_APPEARED` on Android)—approximately when your app's first view has been rendered on the screen—for this particular update, either on this launch or a previous one.

> 💡 **Why this distinction?** In some cases `expo-updates` may try to automatically roll back to an older (working) update, but this can be dangerous if your new update has modified persistent state in a non-backwards compatible way. We assume that if the error occurs before the first view has rendered, no such code has been able to execute, and so rolling back is safe. After this point `expo-updates` will only fix forward and will not roll back.

### If content has appeared

If an error is caught and the "content appeared" event has already fired, OR if it has ever been fired on this device on a past launch of the same update, the following will happen:

- A 5 second timer will be started, and (unless `EXUpdatesCheckOnLaunch`/`expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH` is set to `NEVER`) the app will check for a new update and download it if there is one.
- If there is no new update, the update finishes downloading, or the timer runs out (whichever happens first), the app will throw the original error and crash.

Note that if a new update is downloaded, it will launch when the user next tries to open the app.

### If content has not appeared

If an error is caught before the "content appeared" event has fired, AND this is the first time the current update is being launched on this device, the following will happen:

- The update will be marked as "failed" locally and will not be launched again on this device.
- A 5 second timer will be started, and (unless `EXUpdatesCheckOnLaunch`/`expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH` is set to `NEVER`) the app will check for a new update and download it if there is one.
- If a new update finishes downloading before the timer runs out, the app will immediately try to reload itself and launch the newly downloaded update.
- If this newly downloaded update also throws a fatal error, OR there is no new update, OR the timer runs out, the app will immediately try to reload by rolling back to an older update, whichever one was most recently launched successfully.
- If this also fails, or there is no older update available on the device, the app will throw the original error and crash.

## Note about `expo-error-recovery`

Currently, the error recovery behavior of Expo apps differs between apps built with `expo build:ios`/`expo build:android` and apps built with EAS Build or locally.

The `expo-error-recovery` package is intended for use only for the former case and does not currently integrate with bare apps or apps built with EAS Build.
