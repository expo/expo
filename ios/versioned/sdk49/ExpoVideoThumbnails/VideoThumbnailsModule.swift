import ABI49_0_0ExpoModulesCore
import AVFoundation
import UIKit
import CoreGraphics

public class VideoThumbnailsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoVideoThumbnails")

    AsyncFunction("getThumbnail", getVideoThumbnail).runOnQueue(.main)
  }

  internal func getVideoThumbnail(sourceFilename: URL, options: VideoThumbnailsOptions) throws -> [String: Any] {
    if sourceFilename.isFileURL {
      guard let fileSystem = self.appContext?.fileSystem else {
        throw Exceptions.FileSystemModuleNotFound()
      }

      guard fileSystem.permissions(forURI: sourceFilename).contains(.read) else {
        throw FileSystemReadPermissionException(sourceFilename.absoluteString)
      }
    }

    let asset = AVURLAsset.init(url: sourceFilename, options: ["AVURLAssetHTTPHeaderFieldsKey": options.headers])
    let generator = AVAssetImageGenerator.init(asset: asset)

    generator.appliesPreferredTrackTransform = true
    generator.requestedTimeToleranceBefore = CMTime.zero
    generator.requestedTimeToleranceAfter = CMTime.zero

    let time = CMTimeMake(value: options.time, timescale: 1000)
    let imgRef = try generator.copyCGImage(at: time, actualTime: nil)
    let thumbnail = UIImage.init(cgImage: imgRef)
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
    guard let fileSystem = self.appContext?.fileSystem else {
      throw Exceptions.FileSystemModuleNotFound()
    }

    let directory = URL(fileURLWithPath: fileSystem.cachesDirectory).appendingPathComponent("VideoThumbnails")
    let fileName = UUID().uuidString.appending(".jpg")
    let fileUrl = directory.appendingPathComponent(fileName)

    fileSystem.ensureDirExists(withPath: directory.path)

    guard let data = image.jpegData(compressionQuality: CGFloat(quality)) else {
      throw CorruptedImageDataException()
    }

    do {
      try data.write(to: fileUrl, options: .atomic)
    } catch let error {
      throw ImageWriteFailedException(error.localizedDescription)
    }

    return fileUrl
  }
}
