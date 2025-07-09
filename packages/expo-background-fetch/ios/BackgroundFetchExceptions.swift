import ExpoModulesCore

internal final class BackgroundFetchDisabled: Exception {
  override var reason: String {
    "Background Fetch has not been configured. To enable it, add `fetch` to `UIBackgroundModes` in the application's Info.plist file"
  }
}

internal final class TaskManagerNotFound: Exception {
  override var reason: String {
    "TaskManager not found. Are you sure that Expo modules are properly linked?"
  }
}
