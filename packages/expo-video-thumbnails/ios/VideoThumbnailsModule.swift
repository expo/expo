import ExpoModulesCore
import AVFoundation
import UIKit
import CoreGraphics

public class VideoThumbnailsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoVideoThumbnails")

    AsyncFunction("getThumbnail", getVideoThumbnail)
    AsyncFunction("getNativeThumbnail", getNativeVideoThumbnail)

    Class(NativeVideoThumbnail.self) {
      Property("width", \.ref.size.width)
      Property("height", \.ref.size.height)
      Property("requestedTime", \.requestedTime.seconds)
      Property("actualTime", \.actualTime.seconds)
    }
  }

  internal func getVideoThumbnail(sourceFilename: URL, options: VideoThumbnailsOptions) throws -> [String: Any] {
    if sourceFilename.isFileURL {
      guard FileSystemUtilities.permissions(appContext, for: sourceFilename).contains(.read) else {
        throw FileSystemReadPermissionException(sourceFilename.absoluteString)
      }
    }

    let asset = AVURLAsset(url: sourceFilename, options: ["AVURLAssetHTTPHeaderFieldsKey": options.headers])
    let generator = AVAssetImageGenerator(asset: asset)

    generator.appliesPreferredTrackTransform = true
    generator.requestedTimeToleranceAfter = CMTime.zero

    let time = CMTimeMake(value: options.time, timescale: 1000)

    // `requestedTimeToleranceBefore` can only be set if `time` is less
    // than the video duration, otherwise it will fail to generate an image.
    if time < asset.duration {
      generator.requestedTimeToleranceBefore = .zero
    }

    let imgRef = try generator.copyCGImage(at: time, actualTime: nil)
    let thumbnail = UIImage(cgImage: imgRef)
    let savedImageUrl = try saveImage(image: thumbnail, quality: options.quality)

    return [
      "uri": savedImageUrl.absoluteString,
      "width": thumbnail.size.width,
      "height": thumbnail.size.height
    ]
  }

  /**
  Saves the image as a file.
  */
  internal func saveImage(image: UIImage, quality: Double) throws -> URL {
    let directory = appContext?.config.cacheDirectory?.appendingPathComponent("VideoThumbnails")
    let fileName = UUID().uuidString.appending(".jpg")
    let fileUrl = directory?.appendingPathComponent(fileName)

    FileSystemUtilities.ensureDirExists(at: directory)

    guard let data = image.jpegData(compressionQuality: CGFloat(quality)) else {
      throw CorruptedImageDataException()
    }

    guard let fileUrl else {
      throw ImageWriteFailedException("Unrecognized url \(String(describing: fileUrl?.path))")
    }

    do {
      try data.write(to: fileUrl, options: .atomic)
    } catch let error {
      throw ImageWriteFailedException(error.localizedDescription)
    }

    return fileUrl
  }

  internal func getNativeVideoThumbnail(sourceFilename: URL, options: VideoThumbnailsOptions) async throws -> NativeVideoThumbnail? {
    if sourceFilename.isFileURL {
      guard FileSystemUtilities.permissions(appContext, for: sourceFilename).contains(.read) else {
        throw FileSystemReadPermissionException(sourceFilename.absoluteString)
      }
    }

    let asset = AVURLAsset(url: sourceFilename, options: ["AVURLAssetHTTPHeaderFieldsKey": options.headers])
    let generator = AVAssetImageGenerator(asset: asset)

    generator.appliesPreferredTrackTransform = true
    generator.requestedTimeToleranceAfter = CMTime.zero

    let time = CMTimeMake(value: options.time, timescale: 1000)

    // `requestedTimeToleranceBefore` can only be set if `time` is less
    // than the video duration, otherwise it will fail to generate an image.
    if time < asset.duration {
      generator.requestedTimeToleranceBefore = .zero
    }

    return try await generateNativeThumbnail(generator: generator, time: time)
  }

  private func generateNativeThumbnail(generator: AVAssetImageGenerator, time: CMTime) async throws -> NativeVideoThumbnail? {
    if #available(iOS 16, tvOS 16, *) {
      let result = try await generator.image(at: time)

      return NativeVideoThumbnail(result.image, requestedTime: time, actualTime: result.actualTime)
    }

    let legacyResult = try await VideoThumbnailLegacyGenerator(generator: generator, times: [time])
      .reduce(into: [NativeVideoThumbnail]()) { thumbnails, thumbnail in
        thumbnails.append(thumbnail)
      }
    return legacyResult.first
  }

  /**
    A replacement for the `AVAssetImageGenerator.images(for:)` async iterator that is available only as of iOS 16.
    */
  private struct VideoThumbnailLegacyGenerator: AsyncSequence, AsyncIteratorProtocol {
    let generator: AVAssetImageGenerator
    let times: [CMTime]
    var currentIndex: Int = 0

    mutating func next() async throws -> NativeVideoThumbnail? {
      guard currentIndex < times.count, !Task.isCancelled else {
        return nil
      }
      let requestedTime = times[currentIndex]
      var actualTime = CMTime.zero
      let image = try generator.copyCGImage(at: requestedTime, actualTime: &actualTime)

      currentIndex += 1

      return NativeVideoThumbnail(image, requestedTime: requestedTime, actualTime: actualTime)
    }

    func makeAsyncIterator() -> Self {
      return self
    }
  }
}
