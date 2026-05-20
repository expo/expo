// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

final class DevLauncherInvalidURLException: Exception, @unchecked Sendable {
  override var reason: String {
    "Invalid url provided to loadApp"
  }
}

final class DevLauncherLoadAppException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Failed to load app: \(param)"
  }
}
