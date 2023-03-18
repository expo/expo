import ABI48_0_0ExpoModulesCore

internal class MissingCurrentWindowSceneException: Exception {
  override var reason: String {
    "Cannot determine the current window scene in which to present the modal for requesting a review."
  }
}
