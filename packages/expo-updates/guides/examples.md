# Example flows

Last updated: 2022-10-13

Some more in-depth commentary on what happens in expo-updates during certain flows.

## Launching the app

(release build of a normal app)

1. expo-updates is initialized and started via expo-modules-core and `UpdatesPackage` (Android) or `ExpoUpdatesReactDelegateHandler` (iOS).
2. Native build configuration is read and converted into an `UpdatesConfiguration`/`EXUpdatesConfig` object; database, file system reference, and error recovery handler are initialized.
3. A `LoaderTask` is initialized and started with the `UpdatesConfiguration` object.
4. If `LoaderTask` determines from the `UpdatesConfiguration` that it should check for a new update, it starts a timer with the value of `launchWaitMs`.
5. `LoaderTask` then reads the embedded manifest and decides (using the `SelectionPolicy`) whether to load the embedded update into SQLite with an `EmbeddedLoader`. This must happen on every launch because the build could have been updated natively at any time (e.g. via the App Store), meaning there would be a new embedded update, and we have no way of knowing when this has happened.
6. Before anything else happens, `LoaderTask` then starts an instance of `DatabaseLauncher`, which selects and prepares an update to launch (double checks all assets are available and gets their paths on disk). We now have an update that is certainly safe to launch; if the timer runs out at any point later on, we'll go ahead with launching this update by delegating back to `UpdatesController`.
7. If the app is configured to check for an update, `LoaderTask` will start an instance of `RemoteLoader` on a background thread. `RemoteLoader` will make a request to the update URL for a manifest, use the `SelectionPolicy` to determine whether or not to load the manifest/update into SQLite, and if so, start downloading any assets that SQLite doesn't already have.
8. Once that finishes, `RemoteLoader` fires a callback in `LoaderTask`, which will then decide what to do.
  - If the timer has not yet run out, `LoaderTask` will create a new "candidate" `DatabaseLauncher` which will presumably select and prepare the just-downloaded update for launch, and then delegate back to `UpdatesController` to launch the update.
  - Otherwise, the timer has already run out and so the update selected in step (6) has already been launched. Rather than launching the newly downloaded update, `LoaderTask` will send an event to the running JS instance, notifying it that a new update is available. If the app is listening for Updates events, it can respond by calling `reloadAsync` at this point, which will immediately load the new update.
9. Finally, once all this has completed, `LoaderTask` will run the `Reaper` process in the background. This will clear old updates and assets out of the database, keeping the currently running update, any newer ones, and one older one (the next most recent) as a safeguard in case there is a rollback.

## The app binary is updated (e.g. through the App Store) and then launched

This is similar to the flow above but with some added detail in the middle steps. These illustrate why we must check the embedded update on every launch (step 5 above) in order to be sure of always launching the most recent update.

There are two possible scenarios. (Assume all updates are compatible with all builds.)

### Scenario A

- User downloads build 1 with embedded update A.
- Developer publishes update B.
- User downloads and runs update B.
- Developer releases build 2, with embedded update C, through App Store.
- User updates to build 2 through the App Store. When they launch it, this happens:

1. `LoaderTask` starts. It reads the embedded manifest (for update C) and sees it has a newer `createdAt` date than update B, so loads it into SQLite with an `EmbeddedLoader`.
2. `LoaderTask` creates an instance of `DatabaseLauncher`. It selects update C and prepares it to launch (double checks all the assets are available).
3. `LoaderTask` then creates an instance of `RemoteLoader` which checks for a remote update. At this point, the most recently published update is still B. `RemoteLoader` will download the manifest for update B, see that it's older than C and not download it.
4. `LoaderTask` delegates back to `UpdatesController` with update C.

### Scenario B

- User downloads build 1 with embedded update X.
- Developer releases build 2, with embedded update Y, through App Store. User doesn't download it yet.
- Developer then publishes update Z. (It's compatible with both build 1 and 2.)
- User downloads and runs update Z.
- User finally updates to build 2 through the App Store. When they launch it, this happens:

1. `LoaderTask` starts. It reads the embedded manifest (for update Y) and sees that it's older than update Z (which it already has downloaded), so it doesn't do anything with update Y.
2. `LoaderTask` creates an instance of `DatabaseLauncher`. It selects update Z and prepares it to launch (double checks all the assets are available).
3. `LoaderTask` then creates an instance of `RemoteLoader` which checks for a remote update. The most recently published update is still Z. `RemoteLoader` will download the manifest for update Z and see that it's already in SQLite.
4. `LoaderTask` delegates back to `UpdatesController` with update Z.

## Downloading an update

A more detailed walkthrough of what happens in the `Loader` classes when an update is being loaded onto disk (either from a remote source or from the application package).

1. The manifest is loaded by calling into the subclass method (which will either download the manifest from URL, or read it from its location in the application package).
2. `RemoteLoader` checks to see if the database already has this update. If it does and its status is marked as `READY`, `RemoteLoader` immediately fires its success callback and doesn't do anything else.
3. Otherwise, `RemoteLoader` starts iterating through the assets in the manifest. For each one, it checks to see if (a) it is already in the database and (b) if it already exists on disk (assuming any asset with the same filename is the same asset). If the asset doesn't exist on disk, `RemoteLoader` initiates a download (regardless of whether there is a row for it in the database).
4. Once all the asset downloads are finished, for any assets that were not in the database and are now on disk, `RemoteLoader` adds a row to SQLite.
  - For any asset that was on disk but not in SQLite (which shouldn't happen normally but can happen, for instance, after a destructive database migration), `RemoteLoader` populates the row as if it had just downloaded the asset.
5. If there were no errors and all the assets that comprise the update are now on disk and in SQLite, `RemoteLoader` marks the update as `READY` in SQLite and fires its success callback. Otherwise, it fires the error callback.

## Assets are unexpectedly missing

A more detailed walkthrough of what happens in the `DatabaseLauncher`/`EXUpdatesAppLauncherWithDatabase` classes when an update is being launched, but assets are unexpectedly missing on disk. This should never normally happen, since our file storage is in a location the OS should not clear, but could happen if there are bugs in our code or if asset storage has somehow been corrupted/deleted unexpectedly.

1. Once an update has been selected to launch, `DatabaseLauncher` asserts that the launch asset is nonnull in SQLite.
2. `DatabaseLauncher` then iterates through each asset that comprises the update (including the launch asset) and checks to see if there is a file on disk at the path SQLite says.
3. If there is not, `DatabaseLauncher` attempts to find the asset. First, it reads the embedded manifest to see if it contains the missing asset. If so, it will try to copy the asset from its location embedded in the application package.
4. If not, or if the copy fails, `DatabaseLauncher` will try to download the asset (assuming there is a URL for it in SQLite).
5. If all else fails, `DatabaseLauncher` will fire its failure callback if the launch asset is missing; otherwise it will still fire its success callback and hope that the update can run even without the missing asset.

## Embedded updates on Android with multiple asset scales

There is a weird quirk with `EmbeddedLoader` on Android that has implications for a few other places in the expo-updates codebase.

When `require`ing an image in react-native, it is possible to specify different files to be used on different screen sizes (e.g. `require('./image.png')` could actually be mapped to `image.png`, `image@2x.png`, or `image@3x.png` depending on the device).

On Expo's side, the individual files are simply treated as separate assets, and all of them must be downloaded for an update to be considered `READY`.

For embedded updates on Android, though, these files are placed into different `dpi` directories in `res`, which is the Android OS-level way of specifying per-scale resources. At runtime, the Android `Resources` API only allows access to resources at the scale matched to the current device. This means that assets meant for a different size screen cannot be copied by `EmbeddedLoader` from the application package into expo-updates' asset storage.

In theory, we can still copy all the assets the app should need, and so it should be safe to launch. But to be safe, we mark these updates with a special `EMBEDDED` status in SQLite and launch them directly from the application package (rather than the `.expo-internal` directory) and without asset overrides - meaning the assets, too, are read by RN directly from the application package. This is one of the only times we treat embedded updates differently from any other updates.

This means we have to be careful when launching an update with the `EMBEDDED` status; we have to check to make sure that the embedded update is still the one we are expecting (!) since it could have changed if the user updated their build.
