// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

private let defaultCause = "unknown cause"

internal class PictureInPictureUnsupportedException: Exception {
  override var reason: String {
    "Picture in picture is not supported on this device"
  }
}

internal class DRMUnsupportedException: GenericException<DRMType> {
  override var reason: String {
    "DRMType: `\(param)` is unsupported on iOS"
  }
}

internal class DRMLoadException: GenericException<String?> {
  override var reason: String {
    "Failed to decrypt the video stream: \(param ?? defaultCause)"
  }
}

internal class PlayerException: GenericException<String?> {
  override var reason: String {
    "Failed to initialise the player: \(param ?? defaultCause)"
  }
}

internal class PlayerItemLoadException: GenericException<String?> {
  override var reason: String {
    "Failed to load the player item: \(param ?? defaultCause)"
  }
}

internal class CachingAssetInitializationException: GenericException<URL?> {
  override var reason: String {
    "Failed to initialize a caching asset. The provided url: \(param?.absoluteString ?? "nil") doesn't have a valid scheme for caching"
  }
}

internal class VideoCacheException: GenericException<String?> {
  override var reason: String {
    param ?? "Unexpected expo-video cache error"
  }
}

internal class VideoCacheUnsupportedFormatException: GenericException<String> {
  override var reason: String {
    "The server responded with a resource with mimeType: \(param) which cannot be played with caching enabled"
  }
}
