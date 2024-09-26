// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal class FetchUnknownException: Exception {
  override var reason: String {
    "Unknown error"
  }
}

internal class FetchRequestCanceledException: Exception {
  override var reason: String {
    "Fetch request has been canceled"
  }
}
