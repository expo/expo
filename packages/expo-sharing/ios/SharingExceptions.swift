import ExpoModulesCore

internal final class FilePermissionException: Exception, @unchecked Sendable {
  override var reason: String {
    "You don't have access to the provided file"
  }
}

internal final class MissingCurrentViewControllerException: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot determine currently presented view controller"
  }
}

internal final class UnsupportedTypeException: Exception, @unchecked Sendable {
  override var reason: String {
    "Could not share file since there were no apps registered for its type"
  }
}

internal final class FilePermissionModuleException: Exception, @unchecked Sendable {
  override var reason: String {
    "File permission module not found"
  }
}

internal final class FailedToResolveContentTypeException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Expo-sharing has failed to resolve the content type for \(param)"
  }
}

internal final class FailedToFetchURLContentDetailsException: GenericException<(url: URL, reason: String)>, @unchecked Sendable {
  override var reason: String {
    "Expo-sharing has failed to fetch content type for \(param.url.absoluteString): \(param.reason)"
  }
}

internal final class FailedToResolveAppGroupIdException: Exception, @unchecked Sendable {
  override var reason: String {
    "Expo-sharing has failed to fetch the app group id"
  }
}
