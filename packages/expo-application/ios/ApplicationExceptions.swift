import ExpoModulesCore

internal class InstallationTimeException: Exception {
  override var reason: String {
    "Unable to get installation time of this application."
  }
}
