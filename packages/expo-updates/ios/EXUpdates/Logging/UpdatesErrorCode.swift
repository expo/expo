// Copyright 2022-present 650 Industries. All rights reserved.

import Foundation

/**
 Error codes for expo-updates logs
 */
internal enum UpdatesErrorCode: Int {
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

  // Because this enum is exported to Objective-C,
  // the usual "\(UpdatesErrorCode.NoUpdatesAvailable)"
  // string representation will not work as expected,
  // so we add this representation here
  var asString: String {
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
    case .unknown:
      return "Unknown"
    }
  }
}
