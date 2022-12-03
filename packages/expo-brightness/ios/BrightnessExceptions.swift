import ExpoModulesCore

internal class PermissionsModuleNotFoundException: Exception {
  override var reason: String {
    "Permissions module not found. Are you sure that Expo modules are properly linked?"
  }
}
