import ExpoModulesCore

internal class UrlDocumentDirectoryException: Exception {
  override var reason: String {
    "Unable to get url for document directory in user domain mask."
  }
}

internal class InstallationTimeException: Exception {
  override var reason: String {
    "Unable to get installation time of this application."
  }
}

internal class DateCastException: Exception {
  override var reason: String {
    "Unable to cast string as a date."
  }
}
