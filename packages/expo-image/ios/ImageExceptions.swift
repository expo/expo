import ExpoModulesCore

internal class InvalidIntrinsicSizeException: Exception {
  override var reason: String {
    "Received an intrinsic size with both width and height set to `undefined`. Provide at least one dimension"
  }
}
