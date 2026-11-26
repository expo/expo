import ExpoModulesCore

internal final class UrlDocumentDirectoryException: Exception {
  override var reason: String {
    "Unable to get url for document directory"
  }
}

internal final class InstallationTimeException: Exception {
  override var reason: String {
    "Unable to get installation time of this application"
  }
}

internal final class DateCastException: Exception {
  override var reason: String {
    "Invalid date format"
  }
}
