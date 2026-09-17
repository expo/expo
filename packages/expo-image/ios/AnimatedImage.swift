// Copyright 2024-present 650 Industries. All rights reserved.

internal import SDWebImage

/**
 Custom `SDAnimatedImage` that fixes issues with `images` and `duration` not being available.
 */
final class AnimatedImage: SDAnimatedImage {
  // `SDAnimatedImage` on macOS conforms to `Sendable`, so under Swift 6 strict concurrency a
  // mutable stored property would be a violation. Frame preloading happens behind an internal
  // lazy-init guard, so opting out here is safe.
  nonisolated(unsafe) var frames: [SDImageFrame]?

  // MARK: - UIImage / NSImage

  #if !os(macOS)
  // `NSImage` has no `images` array — on macOS, frames are surfaced through the
  // `SDAnimatedImage` API (`animatedImageFrame(at:)`) and `SDAnimatedImageView` reads them directly.
  override var images: [UIImage]? {
    preloadAllFrames()
    return frames?.map({ $0.image })
  }

  override var duration: TimeInterval {
    preloadAllFrames()
    return frames?.reduce(0, { $0 + $1.duration }) ?? 0.0
  }
  #endif

  // MARK: - SDAnimatedImage

  override func preloadAllFrames() {
    if frames != nil {
      return
    }
    frames = [UInt](0..<animatedImageFrameCount).compactMap { index in
      guard let image = animatedImageFrame(at: index) else {
        return nil
      }
      let duration = animatedImageDuration(at: index)
      return SDImageFrame(image: image, duration: duration)
    }
  }
}
