// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal class InvalidImageException: Exception {
  private let image: String
  init(image: String) {
    self.image = image
  }
  override var reason: String {
    "Invalid base64 image: \(image.prefix(32))\(image.count ?? 0 > 32 ? "..." : "")"
  }
}

internal class InvalidUrlException: Exception {
  private let url: String
  init(url: String) {
    self.url = url
  }
  override var reason: String {
    "Invalid url: \(url)"
  }
}

internal class PasteFailureException: Exception {
  override var reason: String {
    "Failed to get item from clipboard"
  }
}
