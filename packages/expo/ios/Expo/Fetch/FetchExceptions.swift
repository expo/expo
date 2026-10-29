// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal final class FetchUnknownException: Exception {
  override var reason: String {
    "Unknown error"
  }
}

internal final class FetchRequestCanceledException: Exception {
  override var reason: String {
    "Fetch request has been canceled"
  }
}

internal final class FetchRedirectException: Exception {
  override var reason: String {
    "Redirect is not allowed when redirect mode is 'error'"
  }
}

internal final class FetchBlobModuleUnavailableException: Exception {
  override var reason: String {
    "Unable to store the response body as a blob because React Native's BlobModule is not available. " +
    "Make sure your app includes the React Native blob support (React-RCTBlob) or read the body with arrayBuffer() instead"
  }
}
