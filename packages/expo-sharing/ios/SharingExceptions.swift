import ExpoModulesCore

internal final class FailedToResolveContentTypeException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Expo-sharing has failed to resolve the content type for \(param)"
  }
}

internal final class FailedToFetchURLContentDetailsException: GenericException<(URL, String)>, @unchecked Sendable {
  override var reason: String {
    "Expo-sharing has failed to fetch content type for \(param.0.absoluteString): \(param.1)"
  }
}

internal final class FailedToResolveAppGroupIdException: Exception, @unchecked Sendable {
  override var reason: String {
    "Expo-sharing has failed to fetch the app group id"
  }
}
