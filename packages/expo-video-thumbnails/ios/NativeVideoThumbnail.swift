//
//  VideoThumbnail.swift
//  Pods
//
//  Created by Robin Dalmy Tubungbanua on 15/3/2025.
//

import CoreImage
import CoreGraphics
import ExpoModulesCore

internal final class NativeVideoThumbnail: SharedRef<UIImage> {
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
