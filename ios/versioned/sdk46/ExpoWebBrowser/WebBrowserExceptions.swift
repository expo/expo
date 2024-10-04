// Copyright 2022-present 650 Industries. All rights reserved.

import ABI46_0_0ExpoModulesCore

final class WebBrowserAlreadyOpenException: Exception {
  override var reason: String {
    "Another web browser is already open"
  }
}
