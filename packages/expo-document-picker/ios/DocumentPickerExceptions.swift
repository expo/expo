import ExpoModulesCore

internal class UtilitiesInterfaceNotFoundException: Exception {
  override var reason: String {
    "Cannot get utilities from the legacy module registry"
  }
}

internal class MissingCurrentViewControllerException: Exception {
  override var reason: String {
    "Cannot determine currently presented view controller"
  }
}

internal class UnableToGetFileSizeException: Exception {
  override var reason: String {
    "Unable to get file size"
  }
}

internal class UnableToCopyToCachesDirectoryException: Exception {
  override var reason: String {
    "File could not be copied to the caches directory"
  }
}

internal class IncorrectTypeArgumentException: Exception {
  override var reason: String {
    "type must be a list of strings."
  }
}
