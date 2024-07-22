// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal class NetworkFetchURLSessionLostException: Exception {
  override var reason: String {
    "The url session has been lost"
  }
}

internal class NetworkFetchUnknownException: Exception {
  override var reason: String {
    "Unknown error"
  }
}

internal class NetworkFetchRequestCanceledException: Exception {
  override var reason: String {
    "Fetch request has been canceled"
  }
}
