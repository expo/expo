import Foundation

struct IntegrityErrorCodes {
  static let featureUnsupported = "ERR_APP_INTEGRITY_FEATURE_UNSUPPORTED"
  static let invalidInput = "ERR_APP_INTEGRITY_INVALID_INPUT"
  static let invalidKey = "ERR_APP_INTEGRITY_INVALID_KEY"
  static let serverUnavailable = "ERR_APP_INTEGRITY_SERVER_UNAVAILABLE"
  static let systemFailure = "ERR_APP_INTEGRITY_SYSTEM_FAILURE"
  static let decodeFailed = "ERR_APP_INTEGRITY_DECODE_FAILED"
  static let unknown = "ERR_APP_INTEGRITY_UNKNOWN"
}
