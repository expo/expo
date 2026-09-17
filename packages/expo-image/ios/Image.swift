// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore
internal import SDWebImage

internal final class Image: SharedRef<UIImage> {
  override var nativeRefType: String {
    "image"
  }

  var isAnimated: Bool {
    #if os(macOS)
    // `NSImage` has no `images` array — animated frames come from `SDAnimatedImage` (a subclass).
    return (ref as? SDAnimatedImageProvider)?.animatedImageFrameCount ?? 0 > 1
    #else
    return !(ref.images?.isEmpty ?? true)
    #endif
  }

  /**
   Per-image backing scale. `NSImage` has no scale, so on macOS we report 1.0 — HiDPI rendering on
   macOS is driven by the hosting view's `backingScaleFactor` rather than a per-image scale.
   */
  var scale: Double {
    #if os(macOS)
    return 1.0
    #else
    return ref.scale
    #endif
  }

  override func getAdditionalMemoryPressure() -> Int {
    #if os(macOS)
    var proposedRect = CGRect(origin: .zero, size: ref.size)
    guard let cgImage = ref.cgImage(forProposedRect: &proposedRect, context: nil, hints: nil) else {
      return 0
    }
    #else
    guard let cgImage = ref.cgImage else {
      return 0
    }
    #endif
    return cgImage.bytesPerRow * cgImage.height
  }
}
