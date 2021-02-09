# 2019-##-## -- v0.19.0
- **Breaking change:** Updates `ModelManager` with the following API changes:
  - Updates `download(_:)` to `download(_:conditions:)`.
  - Updates `isRemoteModelDownloaded(_:)` to `isModelDownloaded(_:)`.
  - Adds `deleteDownloadedModel(_:completion:)`.
  - Removes the `RemoteModel` and `LocalModel` registration APIs; you no longer
    need to register remote and local models with the `ModelManager`.
- **Breaking change:** `RemoteModel` and `LocalModel` initializers have been
  disabled. New subclasses have been added for AutoML, Custom, and Translate
  SDKs. Use the intializers for those subclasses to create instances of remote
  and local models. `initialConditions` and `updateConditions` are no longer
  needed for initializing a remote model. Download condition should be specified
  each time calling `download(_:conditions:)` of the `ModelManager`.

# 2019-09-03 -- v0.18.0
- Bug fixes.
- [INTERNAL] Changed the minimum iOS version from 9.0 to 8.0.

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
