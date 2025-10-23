import ExpoModulesCore

internal final class MissingCurrentWindowSceneException: Exception {
  override var reason: String {
    "Cannot determine the current window scene in which to present the modal for requesting a review. " +
    "The app may be in the background or the scene is not suitable for presenting the review prompt."
  }
}
