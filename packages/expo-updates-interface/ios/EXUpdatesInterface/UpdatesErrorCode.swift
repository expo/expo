// Copyright 2022-present 650 Industries. All rights reserved.

import Foundation

/**
 Error codes for expo-updates logs
 */
public enum UpdatesErrorCode: Int, Sendable {
  case none = 0
  case noUpdatesAvailable = 1
  case updateAssetsNotAvailable = 2
  case updateServerUnreachable = 3
  case updateHasInvalidSignature = 4
  case updateFailedToLoad = 5
  case assetsFailedToLoad = 6
  case jsRuntimeError = 7
  case unknown = 8
  case updateCodeSigningError = 9
  case initializationError = 10

  /// The `code` string of a log entry, the same as `UpdatesErrorCode.code` on Android.
  public var asString: String {
    switch self {
    case .none:
      return "None"
    case .noUpdatesAvailable:
      return "NoUpdatesAvailable"
    case .updateAssetsNotAvailable:
      return "UpdateAssetsNotAvailable"
    case .updateServerUnreachable:
      return "UpdateServerUnreachable"
    case .updateHasInvalidSignature:
      return "UpdateHasInvalidSignature"
    case .updateCodeSigningError:
      return "UpdateCodeSigningError"
    case .updateFailedToLoad:
      return "UpdateFailedToLoad"
    case .assetsFailedToLoad:
      return "AssetsFailedToLoad"
    case .jsRuntimeError:
      return "JSRuntimeError"
    case .initializationError:
      return "InitializationError"
    case .unknown:
      return "Unknown"
    }
  }
}
