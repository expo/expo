// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

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
    "Failed to decrypt the video stream: \(param ?? "unknown")"
  }
}

internal class PlayerException: GenericException<String?> {
  override var reason: String {
    "Failed to initialise the player: \(param ?? "unknown")"
  }
}

internal class PlayerItemLoadException: GenericException<String?> {
  override var reason: String {
    "Failed to load the player item: \(param ?? "unknown")"
  }
}
