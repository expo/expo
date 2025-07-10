import ExpoModulesCore

internal final class SceneUnavailableAtLocationException: Exception {
  override var reason: String {
    "Look Around is unavailable at this location"
  }
}

internal final class LookAroundAlreadyPresentedException: Exception {
  override var reason: String {
    "Look Around is already being presented"
  }
}
