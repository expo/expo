import ExpoModulesCore

internal final class FilePreviewPermissionException: Exception, @unchecked Sendable {
  override var reason: String {
    "You don't have access to the provided file"
  }
}

internal final class FilePreviewInvalidUriException: GenericException<URL>, @unchecked Sendable {
  override var reason: String {
    "Only local file URIs are supported (got \(param.absoluteString))"
  }
}

internal final class FilePreviewInProgressException: Exception, @unchecked Sendable {
  override var reason: String {
    "Another file preview request is being processed now"
  }
}

internal final class FilePreviewMissingCurrentViewControllerException: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot determine currently presented view controller"
  }
}

internal final class FilePreviewUnsupportedException: GenericException<URL>, @unchecked Sendable {
  override var reason: String {
    "The platform cannot preview the file at \(param.absoluteString)"
  }
}
