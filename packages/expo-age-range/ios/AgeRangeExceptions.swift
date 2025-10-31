import ExpoModulesCore

// The service is not available (e.g., user is not signed in to iCloud on the device/simulator)
final class AgeRangeNotAvailableException: Exception, @unchecked Sendable {
  override var reason: String {
    "The Age Range service is not available"
  }
  override var code: String {
    "ERR_AGE_RANGE_NOT_AVAILABLE"
  }
}

// The request is invalid (e.g., age ranges need to be minimum 2 years apart)
final class AgeRangeInvalidRequestException: Exception, @unchecked Sendable {
  override var reason: String {
    "The request is invalid"
  }
  override var code: String {
    "ERR_AGE_RANGE_INVALID_REQUEST"
  }
}

final class AgeRangeUserDeclinedException: Exception, @unchecked Sendable {
  override var reason: String {
    "The user declined the age verification request"
  }
  override var code: String {
    "ERR_AGE_RANGE_USER_DECLINED"
  }
}

final class AgeRangeNoViewControllerException: Exception, @unchecked Sendable {
  override var reason: String {
    "No current view controller available"
  }
}

final class AgeRangeUnknownResponseException: Exception, @unchecked Sendable {
  override var reason: String {
    "Unknown age range response type"
  }
}
