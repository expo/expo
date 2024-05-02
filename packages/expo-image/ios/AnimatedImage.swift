// Copyright 2024-present 650 Industries. All rights reserved.

import SDWebImage

/**
 Custom `SDAnimatedImage` that fixes issues with `images` and `duration` not being available.
 */
final class AnimatedImage: SDAnimatedImage {
  var frames: [SDImageFrame]?

  // MARK: - UIImage

  override var images: [UIImage]? {
    preloadAllFrames()
    return frames?.map({ $0.image })
  }

  override var duration: TimeInterval {
    preloadAllFrames()
    return frames?.reduce(0, { $0 + $1.duration }) ?? 0.0
  }

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
