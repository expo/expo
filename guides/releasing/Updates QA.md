# Updates QA

## Expo Go (iOS and Android)

- Publish a classic update with the new SDK version and `fallbackToCacheTimeout: 0`. Open it in Expo Go.
- Publish an update with changes to the UI and manifest (splash background color is easy).
- Close and restart Expo Go. Open the project again, should see the changes to the splash screen and app UI right away (ignoring `fallbackToCacheTimeout`).
- Disable network access (maybe turn on airplane mode), close and restart Expo Go, open the same project; should see the most recent update along with the "cached update" alert.
- Add `developmentClient: { silentLaunch: true }` to app.json and publish a new update.
- Close and restart Expo Go, open the project again. The "New update available, downloading" bar should NOT show on the splash screen this time.
- Make a change to the UI and manifest, publish to the `staging` release channel.
- Open the update from the `staging` channel in Expo Go; ensure you see the correct splash screen & UI. Try switching back and forth between the channels.
- Try loading an older project with an unsupported SDK version; should see a helpful error message about SDK versions.
- Add some buttons to your UI that test the `Updates` module methods and publish a new update.
- Test `checkForUpdateAsync`, `fetchUpdateAsync`, and `reloadAsync`; publish another new update and use these methods to download the update and reload with it.
- Publish a similar project for each supported SDK version in Expo Go; test the production module methods in all supported SDK versions.
- Try launching a self-hosted update like https://esamelson.github.io/self-hosting-test/ios-index.json / android-index.json.
- Finally, try opening a saved snack and an unsaved snack.

## Managed standalone apps (iOS and Android)

- Publish an update with `fallbackToCacheTimeout: 0` and build a standalone app (either on turtle or using local expotools commands).
- Make a change to the UI and splash screen and publish it; relaunch the app twice and make sure the app update loads on the second relaunch (the splash screen should stay the same).
- Set `fallbackToCacheTimeout: 100`, then publish and build a new app; uninstall the old app and install the new one.
- Make a change to the UI and publish it; relaunch the app twice and make sure the update loads on the second relaunch (important: it should NOT load on the first relaunch, 100ms is not enough time; if it updates on the first relaunch after publishing, something is wrong).
- Set `fallbackToCacheTimeout: 2000`, then publish and build a new app; uninstall and reinstall.
- Make a change to the UI, set `fallbackToCacheTimeout: 0` and publish it; relaunch the app, this time the new update should load on the first relaunch (make sure you have a good internet connection).
- Disable network access, close and restart the app, ensure it loads the new cached update immediately. Reenable network access.
- Make a change to the UI and publish another new update. To ensure that `fallbackToCacheTimeout: 0` has no effect OTA, relaunch the existing app once and ensure you get the update right away.
- Set `checkAutomatically: ON_ERROR_RECOVERY` and add buttons to your UI to test the `Updates` module methods. Publish and make a new build; uninstall and reinstall.
- Make a change to the UI and publish a new update.
- Relaunch the app a couple times and ensure you don't get the new update; use the module methods to check and fetch the new update, then call `reloadAsync`; should see the new update running right away.
- Relaunch the app and ensure the new update loads again.
- Set `enabled: false`, publish and make a new build; uninstall and reinstall; publish another new update on top of that and ensure you can't load the new update by relaunching or by using the module methods. (The module methods should error.)
- Re-enable updates, make a change to the UI, publish to the `staging` release channel, and make a build pointing to that channel; uninstall and reinstall.
- Ensure the build has the correct update embedded, then publish a new update to the `staging` channel, and ensure you get the update.
- Publish a new update with `enabled: true`, `fallbackToCacheTimeout: 0`, and `checkAutomatically: 'ON_LAUNCH'`. Make a new build and do the following:
  - Uninstall the old build
  - Disable network access on your emulator/device.
  - Install and launch the new build, ensure the embedded update loads immediately.
  - Reenable network access.
  - Publish a new update.
  - Relaunch, see the embedded update (new update should be downloading in the background).
  - Close app after a few seconds and disable network access.
  - Relaunch, see new update.
- Publish another new update and make a new build. This time, **don't uninstall** the old app -- install the new build on top of the old one.
- Make sure network access is still disabled, and then launch the app; you should see the newest (embedded) update immediately. Reenable network access and relaunch the app a couple more times to ensure the new update persists.
- Add an image asset to your UI using `require`, disable network access on your emulator/device, make and install a new build and ensure the image loads right away.
- Add a listener using `Updates.addListener`; make a new build and ensure the listener fires with a "no update available" event.
- Publish a new update, restart the app, and make sure you get an "update downloaded" event; use `reloadAsync` to reload the app and verify you get the new update and **don't** get another event.
- Restart the app again and ensure you get the "no update available" event again.
- Finally, make a build pointing to a self hosted update and ensure it loads; publish an update and ensure you get the update.

## Bare apps (iOS and Android)

- Create a new bare project. make sure LaunchWaitMs is set to 0, then make a release build (if you ran `et android-build-packages` recently, perhaps for the last step, don't forget to clear out `~/.m2/repository` first!).
- Publish an update, restart the app twice and ensure it loads on the second restart.
- Do the same for 100 and 2000 ms. (The 2000 ms build should load an update on the **first** relaunch after you publish the update.)
- After the 2000 ms test, after downloading an update, disable network access, relaunch the app and make sure it loads the cached update.
- Set CheckOnLaunch to NEVER, add buttons to your UI to test the `Updates` module methods, and make a new build.
- Publish an update, then restart the app a couple times to make sure you don't get the update automatically.
- Use the module methods to check and fetch the new update, then reload the UI with `reloadAsync`.
- Close and relaunch the app and ensure the new update loads again.
- Set Enabled to false, make a new build.
- Publish an update, then ensure it doesn't load automatically, and that you can't load the update by using the module methods (they should error).
- Re-enable updates, set ReleaseChannel to staging, and make a new build.
- Publish an update to the `staging` release channel and make sure you get the update.
- Set ReleaseChannel back to default and LaunchWaitMs to 0, CheckOnLaunch ALWAYS, and do the following sequence:
    - Disable network access on the emulator/device. Uninstall old builds of the app.
    - Make and install a new build; ensure the embedded update loads immediately.
    - Publish an update, and reenable network access.
    - Relaunch the app, see embedded update (new update should be downloading in background).
    - Close app and disable network access again.
    - Relaunch app, should see new update immediately.
    - Make another new build and install it over top of the existing build (don't uninstall). Make sure network access is still disabled at this point.
    - Launch the app, you should see a new embedded update from the new build.
    - Reenable network access and relaunch a couple times to ensure the update persists.
- Add an image asset to your UI using `require`, disable network access on your emulator/device, make a new build and ensure the image loads right away.
- Add a listener to `Updates.addListener`; make a new build and ensure the listener fires with a "no update available" event.
- Publish a new update, restart the app, and make sure you get an "update downloaded" event; use `reloadAsync` to reload the app and verify you get the new update and **don't** get another event.
- Restart the app again and ensure you get the "no update available" event again.