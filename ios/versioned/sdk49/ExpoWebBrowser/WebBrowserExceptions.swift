// Copyright 2022-present 650 Industries. All rights reserved.

import ABI49_0_0ExpoModulesCore

final class WebBrowserAlreadyOpenException: Exception {
  override var reason: String {
    "Another web browser is already open"
  }
}

final class WebBrowserInvalidURLException: Exception {
  override var reason: String {
    return "The provided URL is not valid."
  }
}
