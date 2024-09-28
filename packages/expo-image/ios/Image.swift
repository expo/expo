// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal final class Image: SharedRef<UIImage> {
  override func getAdditionalMemoryPressure() -> Int {
    guard let cgImage = ref.cgImage else {
      return 0
    }
    return cgImage.bytesPerRow * cgImage.height
  }
}
