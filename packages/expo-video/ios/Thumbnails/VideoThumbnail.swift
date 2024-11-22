// Copyright 2024-present 650 Industries. All rights reserved.

import CoreImage
import CoreGraphics
import ExpoModulesCore

internal final class VideoThumbnail: SharedRef<UIImage> {
  internal override var nativeRefType: String {
    "image"
  }

  var requestedTime: CMTime
  var actualTime: CMTime

  internal init(_ image: CGImage, requestedTime: CMTime, actualTime: CMTime) {
    self.requestedTime = requestedTime
    self.actualTime = actualTime
    super.init(UIImage(cgImage: image))
  }

  override func getAdditionalMemoryPressure() -> Int {
    guard let cgImage = ref.cgImage else {
      return 0
    }
    return cgImage.bytesPerRow * cgImage.height
  }
}
