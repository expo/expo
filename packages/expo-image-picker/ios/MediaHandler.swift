// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
import MobileCoreServices
import Photos

internal struct MediaHandler {
  internal weak var fileSystem: EXFileSystemInterface?
  internal let options: ImagePickerOptions

  internal func handleMedia(_ mediaInfo: MediaInfo, completion: @escaping (AsyncResult) -> Void) {
    let mediaType: String? = mediaInfo[UIImagePickerController.InfoKey.mediaType] as? String
    let imageType = kUTTypeImage as String
    let videoType = kUTTypeMovie as String

    switch mediaType {
    case imageType: return handleImage(mediaInfo: mediaInfo, completion: completion)
    case videoType: return handleVideo(mediaInfo: mediaInfo, completion: completion)
    default: return completion(.failure(InvalidMediaTypeException(mediaType)))
    }
  }

  // MARK: - Image

  // TODO: convert to async/await syntax once we drop support for iOS 12
  private func handleImage(mediaInfo: MediaInfo, completion: @escaping (AsyncResult) -> Void) {
    do {
      guard let image = ImageUtils.readImageFrom(mediaInfo: mediaInfo, shouldReadCroppedImage: options.allowsEditing) else {
        return completion(.failure(FailedToReadImageException()))
      }

      let (imageData, fileExtension) = try ImageUtils.readDataAndFileExtension(image: image,
                                                                               mediaInfo: mediaInfo,
                                                                               options: options)

      let targetUrl = try generateUrl(withFileExtension: fileExtension)

      // no modification requested
      let imageModified = options.allowsEditing || options.quality != nil
      let fileWasCopied = !imageModified && ImageUtils.tryCopyingOriginalImageFrom(mediaInfo: mediaInfo, to: targetUrl)
      if !fileWasCopied {
        try ImageUtils.write(imageData: imageData, to: targetUrl)
      }

      let base64 = try ImageUtils.optionallyReadBase64From(imageData: imageData,
                                                           orImageFileUrl: targetUrl,
                                                           tryReadingFile: fileWasCopied,
                                                           shouldReadBase64: self.options.base64)

      ImageUtils.optionallyReadExifFrom(mediaInfo: mediaInfo, shouldReadExif: self.options.exif) { exif in
        let result: ImagePickerResponse = .image(ImageInfo(uri: targetUrl.absoluteString,
                                                           width: image.size.width,
                                                           height: image.size.height,
                                                           base64: base64,
                                                           exif: exif))
        completion(.success(result))
      }
    } catch let exception as Exception {
      return completion(.failure(exception))
    } catch {
      return completion(.failure(UnexpectedException(error)))
    }
  }

  // MARK: - Video

  // TODO: convert to async/await syntax once we drop support for iOS 12
  func handleVideo(mediaInfo: MediaInfo, completion: (AsyncResult) -> Void) {
    do {
      guard let pickedVideoUrl = VideoUtils.readVideoUrlFrom(mediaInfo: mediaInfo) else {
        return completion(.failure(FailedToReadVideoException()))
      }

      let targetUrl = try generateUrl(withFileExtension: ".mov")

      try VideoUtils.tryCopyingVideo(at: pickedVideoUrl, to: targetUrl)

      guard let size = VideoUtils.readSizeFrom(url: targetUrl) else {
        return completion(.failure(FailedToReadVideoSizeException()))
      }

      // If video was edited (the duration is affected) then read the duration from the original edited video.
      // Otherwise read the duration from the target video file.
      // TODO: (@bbarthec): inspect whether it makes sense to read duration from two different assets
      let videoUrlToReadDurationFrom = self.options.allowsEditing ? pickedVideoUrl : targetUrl
      let duration = VideoUtils.readDurationFrom(url: videoUrlToReadDurationFrom)

      let result: ImagePickerResponse = .video(VideoInfo(uri: targetUrl.absoluteString,
                                                         width: size.width,
                                                         height: size.height,
                                                         duration: duration))
      completion(.success(result))
    } catch let exception as Exception {
      return completion(.failure(exception))
    } catch {
      return completion(.failure(UnexpectedException(error)))
    }
  }

  // MARK: - utils

  private func generateUrl(withFileExtension: String) throws -> URL {
    guard let fileSystem = self.fileSystem else {
      throw FileSystemModuleNotFoundException()
    }
    let directory =  fileSystem.cachesDirectory.appending(
      fileSystem.cachesDirectory.hasSuffix("/") ? "" : "/" + "ImagePicker"
    );
    let path = fileSystem.generatePath(inDirectory: directory, withExtension: withFileExtension)
    let url = URL(fileURLWithPath: path)
    return url
  }
}

private struct ImageUtils {
  static func readImageFrom(mediaInfo: MediaInfo, shouldReadCroppedImage: Bool) -> UIImage? {
    guard let originalImage = mediaInfo[.originalImage] as? UIImage,
          let image = originalImage.fixOrientation()
    else {
      return nil
    }

    if !shouldReadCroppedImage {
      return image
    }

    guard let cropRect = mediaInfo[.cropRect] as? CGRect,
          let croppedImage = ImageUtils.crop(image: image, to: cropRect)
    else {
      return nil
    }

    return croppedImage
  }

  static func crop(image: UIImage, to: CGRect) -> UIImage? {
    guard let cgImage = image.cgImage?.cropping(to: to) else {
      return nil
    }
    return UIImage(cgImage: cgImage,
                   scale: image.scale,
                   orientation: image.imageOrientation)
  }

  static func readDataAndFileExtension(
    image: UIImage,
    mediaInfo: MediaInfo,
    options: ImagePickerOptions
  ) throws -> (imageData: Data?, fileExtension: String) {
    let compressionQuality = options.quality ?? DEFAULT_QUALITY

    // nil when an image is picked from camera
    let referenceUrl = mediaInfo[.referenceURL] as? URL

    switch referenceUrl?.absoluteString {
    case .some(let s) where s.contains("ext=PNG"):
      let data = image.pngData()
      return (data, ".png")

    case .some(let s) where s.contains("ext=BMP"):
      if options.allowsEditing || options.quality != nil {
        // switch to png if editing
        let data = image.pngData()
        return (data, ".png")
      }
      return (nil, ".bmp")

    case .some(let s) where s.contains("ext=GIF"):
      guard let data = image.jpegData(compressionQuality: compressionQuality) else {
        throw FailedToReadImageDataException()
      }

      // swiftlint:disable:next force_cast
      guard let imageDestination = CGImageDestinationCreateWithData(data as! CFMutableData, kUTTypeGIF, 1, nil),
            let cgImage = image.cgImage
      else {
        throw FailedToCreateGifException()
      }

      var metadata = mediaInfo[.mediaMetadata] as? [String: Any] ?? [:]
      if options.quality != nil {
        metadata[kCGImageDestinationLossyCompressionQuality as String] = options.quality
      }

      CGImageDestinationAddImage(imageDestination, cgImage, metadata as CFDictionary)

      if !CGImageDestinationFinalize(imageDestination) {
        throw FailedToExportGifException()
      }

      return (data, ".gif")

    default:
      let data = image.jpegData(compressionQuality: compressionQuality)
      return (data, ".jpg")
    }
  }

  static func write(imageData: Data?, to: URL) throws {
    do {
      try imageData?.write(to: to, options: [.atomic])
    } catch {
      throw FailedToWriteImageException()
        .causedBy(error)
    }
  }

  /**
   @returns `true` upon copying success and `false` otherwise
   */
  static func tryCopyingOriginalImageFrom(mediaInfo: MediaInfo, to: URL) -> Bool {
    guard let from = mediaInfo[.imageURL] as? URL else {
      return false
    }

    do {
      try FileManager.default.copyItem(atPath: from.path, toPath: to.path)
      return true
    } catch {
      return false
    }
  }

  /**
   Reads base64 representation of the image data. If the data is `nil` fallbacks to reading the data from the url.
   */
  static func optionallyReadBase64From(
    imageData: Data?,
    orImageFileUrl url: URL,
    tryReadingFile: Bool,
    shouldReadBase64: Bool
  ) throws -> String? {
    if !shouldReadBase64 {
      return nil
    }

    if tryReadingFile {
      do {
        let data = try Data(contentsOf: url)
        return data.base64EncodedString()
      } catch {
        throw FailedToReadImageDataException()
          .causedBy(error)
      }
    }

    guard let data = imageData else {
      throw FailedToReadImageDataForBase64Exception()
    }

    return data.base64EncodedString()
  }

  static func optionallyReadExifFrom(
    mediaInfo: MediaInfo,
    shouldReadExif: Bool,
    completion: @escaping (_ result: [String: Any]?) -> Void
  ) {
    if !shouldReadExif {
      return completion(nil)
    }

    let metadata = mediaInfo[.mediaMetadata] as? [String: Any]

    if metadata != nil {
      let exif = ImageUtils.readExifFrom(imageMetadata: metadata!)
      return completion(exif)
    }

    guard let imageUrl = mediaInfo[.referenceURL] as? URL else {
      NSLog("Could not fetch metadata for image")
      return completion(nil)
    }

    let assets = PHAsset.fetchAssets(withALAssetURLs: [imageUrl], options: nil)

    guard let asset = assets.firstObject else {
      NSLog("Could not fetch metadata for image '\(imageUrl.absoluteString)'.")
      return completion(nil)
    }

    let options = PHContentEditingInputRequestOptions()
    options.isNetworkAccessAllowed = true
    asset.requestContentEditingInput(with: options) { input, info in
      guard let imageUrl = input?.fullSizeImageURL,
            let properties = CIImage(contentsOf: imageUrl)?.properties
      else {
        NSLog("Could not fetch metadata for '\(imageUrl.absoluteString)'.")
        return completion(nil)
      }
      let exif = ImageUtils.readExifFrom(imageMetadata: properties)
      return completion(exif)
    }
  }

  static func readExifFrom(imageMetadata: [String: Any]) -> [String: Any] {
    var exif: [String: Any] = imageMetadata[kCGImagePropertyExifDictionary as String] as? [String: Any] ?? [:]

    // Copy ["{GPS}"]["<tag>"] to ["GPS<tag>"]
    let gps = imageMetadata[kCGImagePropertyGPSDictionary as String] as? [String: Any]
    if gps != nil {
      gps!.forEach { key, value in
        exif["GPS\(key)"] = value
      }
    }

    // Inject orientation into exif
    let orientationKey = kCGImagePropertyOrientation as String
    let orientationValue = imageMetadata[orientationKey]
    if orientationValue != nil {
      exif[orientationKey] = orientationValue
    }

    return exif
  }
}

private struct VideoUtils {
  static func tryCopyingVideo(at: URL, to: URL) throws {
    do {
      // we copy the file as `moveItem(at:,to:)` throws an error in iOS 13 due to missing permissions
      try FileManager.default.copyItem(at: at, to: to)
    } catch {
      throw FailedToPickVideoException()
        .causedBy(error)
    }
  }

  /**
   @returns duration in milliseconds
   */
  static func readDurationFrom(url: URL) -> Double {
    let asset = AVURLAsset(url: url)
    return Double(asset.duration.value) / Double(asset.duration.timescale) * 1_000
  }

  static func readSizeFrom(url: URL) -> CGSize? {
    let asset = AVURLAsset(url: url)
    let size: CGSize? = asset.tracks(withMediaType: .video).first?.naturalSize
    return size
  }

  static func readVideoUrlFrom(mediaInfo: MediaInfo) -> URL? {
    return mediaInfo[.mediaURL] as? URL
        ?? mediaInfo[.referenceURL] as? URL
  }
}
