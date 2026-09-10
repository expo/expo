// Copyright 2024-present 650 Industries. All rights reserved.

internal import SDWebImage

/**
 Custom `SDAnimatedImage` that fixes issues with `images` and `duration` not being available.
 */
final class AnimatedImage: SDAnimatedImage, @unchecked Sendable {
  /**
   * Frame schedule for `SharedAnimationDriver`, built once per image.
   */
  var sharedAnimationTimeline: AnimationTimeline?

  // MARK: - UIImage

  override var images: [UIImage]? {
    guard animatedImageFrameCount > 1 else {
      return nil
    }
    // Shares SDWebImage's frame store with `SharedAnimationDriver`, so frames are decoded once.
    preloadAllFrames()
    return (0..<animatedImageFrameCount).compactMap { animatedImageFrame(at: $0) }
  }

  override var duration: TimeInterval {
    return (0..<animatedImageFrameCount).reduce(0.0) { $0 + animatedImageDuration(at: $1) }
  }
}
