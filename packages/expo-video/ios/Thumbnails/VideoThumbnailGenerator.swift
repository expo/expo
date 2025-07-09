// Copyright 2024-present 650 Industries. All rights reserved.

import AVFoundation
import CoreMedia

/**
 Generates an array of thumbnails from the given assets and options.
 */
internal func generateThumbnails(asset: AVAsset, times: [CMTime], options: VideoThumbnailOptions?) async throws -> [VideoThumbnail] {
  let generator = AVAssetImageGenerator(asset: asset)

  generator.appliesPreferredTrackTransform = true
  generator.requestedTimeToleranceAfter = .zero
  generator.maximumSize = options?.getMaxSize() ?? .zero

  // `requestedTimeToleranceBefore` can only be set if times are less
  // than the video duration, otherwise it will fail to generate an image.
  if times.allSatisfy({ $0 < asset.duration }) {
    generator.requestedTimeToleranceBefore = .zero
  }
  return try await generateThumbnails(generator: generator, times: times)
}

/**
 Generates an array of thumbnails using the given image generator. It uses two different ways to generate the images, based on the platform version.
 */
private func generateThumbnails(generator: AVAssetImageGenerator, times: [CMTime]) async throws -> [VideoThumbnail] {
  if #available(iOS 16, tvOS 16, *) {
    return try await generator
      .images(for: times)
      .reduce(into: [VideoThumbnail]()) { thumbnails, result in
        let thumbnail = try VideoThumbnail(result.image, requestedTime: result.requestedTime, actualTime: result.actualTime)
        thumbnails.append(thumbnail)
      }
  }
  return try await VideoThumbnailLegacyGenerator(generator: generator, times: times)
    .reduce(into: [VideoThumbnail]()) { thumbnails, thumbnail in
      thumbnails.append(thumbnail)
    }
}

/**
 A replacement for the `AVAssetImageGenerator.images(for:)` async iterator that is available only as of iOS 16.
 */
internal struct VideoThumbnailLegacyGenerator: AsyncSequence, AsyncIteratorProtocol {
  typealias Element = VideoThumbnail

  let generator: AVAssetImageGenerator
  let times: [CMTime]
  var currentIndex: Int = 0

  mutating func next() async throws -> Element? {
    guard currentIndex < times.count, !Task.isCancelled else {
      return nil
    }
    let requestedTime = times[currentIndex]
    var actualTime = CMTime.zero
    let image = try generator.copyCGImage(at: requestedTime, actualTime: &actualTime)

    currentIndex += 1

    return VideoThumbnail(image, requestedTime: requestedTime, actualTime: actualTime)
  }

  func makeAsyncIterator() -> Self {
    return self
  }
}
