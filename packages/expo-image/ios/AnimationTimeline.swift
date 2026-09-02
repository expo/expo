// Copyright 2025-present 650 Industries. All rights reserved.

internal import SDWebImage

// Maps time on the shared clock to a frame index of an animated image.
struct AnimationTimeline {
  // End time of each frame within one loop.
  private let frameEndTimes: [TimeInterval]

  let totalDuration: TimeInterval

  var frameCount: Int {
    return frameEndTimes.count
  }

  // Returns `nil` for images with fewer than two frames or no duration.
  init?(image: SDAnimatedImage) {
    let frameCount = Int(image.animatedImageFrameCount)
    guard frameCount > 1 else {
      return nil
    }
    var frameEndTimes: [TimeInterval] = []
    frameEndTimes.reserveCapacity(frameCount)
    var totalDuration: TimeInterval = 0

    for index in 0..<frameCount {
      totalDuration += max(image.animatedImageDuration(at: UInt(index)), 0)
      frameEndTimes.append(totalDuration)
    }
    guard totalDuration > 0 else {
      return nil
    }
    self.frameEndTimes = frameEndTimes
    self.totalDuration = totalDuration
  }

  // Index of the frame visible `elapsed` seconds after the clock started. The animation loops forever.
  func frameIndex(atElapsed elapsed: TimeInterval) -> UInt {
    guard elapsed > 0 else {
      return 0
    }
    let position = elapsed.truncatingRemainder(dividingBy: totalDuration)
    var low = 0
    var high = frameEndTimes.count - 1

    while low < high {
      let middle = (low + high) / 2
      if frameEndTimes[middle] > position {
        high = middle
      } else {
        low = middle + 1
      }
    }
    return UInt(low)
  }
}
