# 2019-07-09 -- v0.17.0
- Bug fixes.

# 2019-05-07 -- v0.16.0
- Adds `download(_:)` API to `ModelManager` class for downloading a remote
  model. Caller can monitor the returned `NSProgress` and receive notifications
  defined in `FIRModelDownloadNotifications.h`.

# 2019-03-19 -- v0.15.0
-  **Breaking change:** Renamed model downloading APIs in FirebaseMLCommon
  (no change to functionality):
    - Renamed `CloudModelSource` to `RemoteModel` and `LocalModelSource`
      to `LocalModel`.
    - Updated `ModelManager` methods to reflect the renaming of the model
      classes.
    - Renamed the following properties in `ModelDownloadConditions`:
      `isWiFiRequired` is now `allowsCellularAccess` and
      `canDownloadInBackground` is now `allowsBackgroundDownloading`.

# 2019-01-22 -- v0.14.0
- Adds the `ModelManager` class for downloading and managing custom models from
  the cloud.
- Adds `CloudModelSource` and `LocalModelSource` classes for defining and registering
  custom cloud and local models. These classes were previously defined in
  `FirebaseMLModelInterpreter`.
