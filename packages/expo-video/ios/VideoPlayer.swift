// Copyright 2023-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoModulesCore

internal final class VideoPlayer: SharedRef<AVPlayer> {
  let contentKeyManager = ContentKeyManager()
}
