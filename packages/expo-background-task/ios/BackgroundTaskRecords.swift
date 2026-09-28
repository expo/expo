// Copyright 2024-present 650 Industries. All rights reserved.
import ExpoModulesCore
import UIKit

enum BackgroundTaskStatus: Int, Enumerable {
  case restricted = 1
  case available = 2
  case denied = 3
}

extension BackgroundTaskStatus {
  /**
   Maps the system Background App Refresh setting onto the status reported to JavaScript.

   An unknown future case is reported as `available`: a status we cannot interpret must not make
   apps tell their users that background refresh is switched off when it may well be on.
   */
  init(refreshStatus: UIBackgroundRefreshStatus) {
    switch refreshStatus {
    case .available:
      self = .available
    case .denied:
      self = .denied
    case .restricted:
      self = .restricted
    @unknown default:
      self = .available
    }
  }
}

enum BackgroundTaskResult: Int, Enumerable {
  case success = 1
  case failed = 2
}
