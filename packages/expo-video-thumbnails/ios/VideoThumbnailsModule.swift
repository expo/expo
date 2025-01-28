import ExpoModulesCore
import AVFoundation
import UIKit
import CoreGraphics

public class VideoThumbnailsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoVideoThumbnails")

    AsyncFunction("getThumbnail", getVideoThumbnail)
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
}
