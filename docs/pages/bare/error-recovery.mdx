---
title: Error Recovery
sidebar_title: Error Recovery
---

import { Tab, Tabs } from '~/components/plugins/Tabs';

Apps using `expo-updates` can take advantage of built-in error recovery behavior as an extra safeguard against accidentally publishing broken updates.

While we cannot stress enough the importance of testing updates in a staging environment before publishing to production, humans (and even computers) occasionally make mistakes, and the error recovery behavior described here can serve as a last resort in such cases.

> Disclaimer: the behavior documented below is subject to change and should not be relied upon. Always test your code carefully and thoroughly in production-like environments before publishing updates.

## Help! I published a broken update to production. What should I do?

First of all, don't panic. Mistakes happen; most likely, everything will be fine.

The important thing is to **publish a new update with a fix as soon as possible (though not before you are 100% confident in your fix).** The error recovery mechanism in `expo-updates` will ensure that in most cases, even users who have already downloaded the broken update should be able to get the fix.

The first thing to try is rolling back to an older update that you know was working. **However, this may not always be safe;** your broken update may, for example, have modified persistent state (such as data stored in AsyncStorage or on the device's file system) in a non-backwards-compatible way. It's important to test in a staging environment that emulates an end user's device state as closely as possible—i.e. load the broken update and then roll back.

If you can identify an older update that is safe to roll back to, you can do so using [EAS Update's `republish` option](/eas-update/eas-update-and-eas-cli/#republish-a-previous-update-within-a-branch).

If you cannot identify an older update that is safe to roll back to, you'll need to fix forward. While it's best to roll out a fix as quickly as possible, you should take the time to ensure your fix is solid, and know that even users who download your broken update in the meantime should be able to download your fix.

If you'd like more details about how this works, read on.

## Explaining the error recovery flow

The error recovery flow is intended to be as lightweight as possible. It is not a full safety net that protects your end users from the results of errors; in many cases users will still see a crash.

Rather, the purpose is to prevent updates from "bricking" your app (causing a crash on launch before the app can check for updates, making the app unusable until uninstalled and reinstalled) by ensuring that in as many cases as possible, the app has the opportunity to download a new update and fix itself.

### Catching an error

If your app throws a fatal error when executing JS which is early enough in the app's lifecycle that it may prevent the app from being able to download further updates, `expo-updates` will catch this error.

> If more than 10 seconds have elapsed between your app's first render and the time a fatal error is thrown, `expo-updates` will not catch this error at all and none of the error recovery code will be triggered. Therefore, we highly recommend that your app check for updates very shortly after launching, whether [automatically](/bare/updating-your-app/#automatic-updates) or [manually](/bare/updating-your-app/#manual-updates) to ensure you can push out fixes in the event of a future error.

If `expo-updates` catches a JS error, what will happen next depends on whether React Native has fired the native "content appeared" event (`RCTContentDidAppearNotification` on iOS, or `ReactMarkerConstants.CONTENT_APPEARED` on Android)—approximately when your app's first view has been rendered on the screen—for this particular update, either on this launch or a previous one.

> **Why this distinction?** In some cases `expo-updates` may try to automatically roll back to an older (working) update, but this can be dangerous if your new update has modified persistent state in a non-backwards compatible way. We assume that if the error occurs before the first view has rendered, no such code has been able to execute, and so rolling back is safe. After this point `expo-updates` will only fix forward and will not roll back.

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

## Error stacktraces

If your app encounters a fatal JS error, and the error recovery system cannot recover, it will re-throw the original exception in order to cause a crash. The stacktrace will look similar to this:

<Tabs tabs={["iOS", "Android"]}>

<Tab>

```
Last Exception Backtrace:
0   CoreFoundation                	0xf203feba4 __exceptionPreprocess + 220 (NSException.m:200)
1   libobjc.A.dylib               	0xf201a1be7 objc_exception_throw + 60 (objc-exception.mm:565)
2   MyApp                         	0x10926b7ee -[EXUpdatesAppController throwException:] + 24 (EXUpdatesAppController.m:422)
3   MyApp                         	0x109280352 -[EXUpdatesErrorRecovery _crash] + 984 (EXUpdatesErrorRecovery.m:222)
4   MyApp                         	0x10927fa3d -[EXUpdatesErrorRecovery _runNextTask] + 148 (EXUpdatesErrorRecovery.m:0)
5   libdispatch.dylib             	0x109bc1848 _dispatch_call_block_and_release + 32 (init.c:1517)
6   libdispatch.dylib             	0x109bc2a2c _dispatch_client_callout + 20 (object.m:560)
7   libdispatch.dylib             	0x109bc93a6 _dispatch_lane_serial_drain + 668 (inline_internal.h:2622)
8   libdispatch.dylib             	0x109bca0bc _dispatch_lane_invoke + 392 (queue.c:3944)
9   libdispatch.dylib             	0x109bd6472 _dispatch_workloop_worker_thread + 648 (queue.c:6732)
10  libsystem_pthread.dylib       	0xf6da2845d _pthread_wqthread + 288 (pthread.c:2599)
11  libsystem_pthread.dylib       	0xf6da2742f start_wqthread + 8
```

Even though it appears the exception was thrown from expo-updates, this stacktrace generally indicates **an error that originated in JavaScript**.

Unfortunately, Apple's crash reporting does not include the exception message, which details the underlying error and its location in JavaScript. To see the message and help you narrow down the issue, you may need to reproduce the crash locally with the Xcode debugger or macOS Console app attached.

</Tab>

<Tab>

```
--------- beginning of crash
AndroidRuntime: FATAL EXCEPTION: expo-updates-error-recovery
AndroidRuntime: Process: com.myapp.MyApp, PID: 12498
AndroidRuntime: com.facebook.react.common.JavascriptException
AndroidRuntime:
AndroidRuntime: 	at com.facebook.react.modules.core.ExceptionsManagerModule.reportException(ExceptionsManagerModule.java:72)
AndroidRuntime: 	at java.lang.reflect.Method.invoke(Native Method)
AndroidRuntime: 	at com.facebook.react.bridge.JavaMethodWrapper.invoke(JavaMethodWrapper.java:372)
AndroidRuntime: 	at com.facebook.react.bridge.JavaModuleWrapper.invoke(JavaModuleWrapper.java:188)
AndroidRuntime: 	at com.facebook.react.bridge.queue.NativeRunnable.run(Native Method)
AndroidRuntime: 	at android.os.Handler.handleCallback(Handler.java:938)
AndroidRuntime: 	at android.os.Handler.dispatchMessage(Handler.java:99)
AndroidRuntime: 	at com.facebook.react.bridge.queue.MessageQueueThreadHandler.dispatchMessage(MessageQueueThreadHandler.java:27)
AndroidRuntime: 	at android.os.Looper.loop(Looper.java:223)
AndroidRuntime: 	at com.facebook.react.bridge.queue.MessageQueueThreadImpl$4.run(MessageQueueThreadImpl.java:228)
AndroidRuntime: 	at java.lang.Thread.run(Thread.java:923)
```

On Android, the stacktrace of the original exception is preserved. Depending on your crash reporting service, you may or may not need to reproduce the crash locally in order to see more information about the underlying error.

</Tab>

</Tabs>
