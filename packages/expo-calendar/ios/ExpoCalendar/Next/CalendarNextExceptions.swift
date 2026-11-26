import ExpoModulesCore

final internal class MissingCurrentViewControllerException: Exception {
  override var reason: String {
    "Cannot find the current view controller to present"
  }
}
