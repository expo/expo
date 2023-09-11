import ExpoModulesCore

internal class InvalidFileException: Exception {
  override var reason: String {
    "Unable to get file size"
  }
}

internal class PickingInProgressException: Exception {
  override var reason: String {
    "Different document picking in progress. Await other document picking first"
  }
}

internal class MissingViewControllerException: Exception {
  override var reason: String {
    "Could not find the current ViewController"
  }
}
