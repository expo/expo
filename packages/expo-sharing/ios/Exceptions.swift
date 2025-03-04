import ExpoModulesCore

internal final class FilePermissionException: Exception {
  override var reason: String {
    "You don't have access to the provided file"
  }
}

internal final class MissingCurrentViewControllerException: Exception {
  override var reason: String {
    "Cannot determine currently presented view controller"
  }
}

internal final class UnsupportedTypeException: Exception {
  override var reason: String {
    "Could not share file since there were no apps registered for its type"
  }
}

internal final class FilePermissionModuleException: Exception {
  override var reason: String {
    "File permission module not found"
  }
}
