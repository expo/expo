// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal class PictureInPictureUnsupportedException: Exception {
  override var reason: String {
    "Picture in picture is not supported on this device"
  }
}
