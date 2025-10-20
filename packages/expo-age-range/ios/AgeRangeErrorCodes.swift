import Foundation

internal struct AgeRangeErrorCodes {
  static let featureUnsupported = "ERR_AGE_RANGE_FEATURE_UNSUPPORTED"
  static let notAvailable = "ERR_AGE_RANGE_NOT_AVAILABLE"
  // the age ranges need to be minimum 2 years apart
  static let invalidRequest = "ERR_AGE_RANGE_INVALID_REQUEST"
  static let userDeclined = "ERR_AGE_RANGE_USER_DECLINED"
}
