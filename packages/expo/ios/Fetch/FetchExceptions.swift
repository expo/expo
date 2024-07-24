// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal class FetchURLSessionLostException: Exception {
  override var reason: String {
    "The URL session has been lost"
  }
}

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
