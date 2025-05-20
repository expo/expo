// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal final class Image: SharedRef<UIImage> {
  override var nativeRefType: String {
    "image"
  }

  var isAnimated: Bool {
#if os(iOS) || os(tvOS)
    return !(ref.images?.isEmpty ?? true)
#else
    return false
#endif
  }

  override func getAdditionalMemoryPressure() -> Int {
    guard let cgImage = ref.cgImage else {
      return 0
    }
    return cgImage.bytesPerRow * cgImage.height
  }
}
