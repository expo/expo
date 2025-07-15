import ExpoModulesCore

final class ReloadOverlayException: Exception {
  override var reason: String {
    "Failed to create overlay window"
  }
}
