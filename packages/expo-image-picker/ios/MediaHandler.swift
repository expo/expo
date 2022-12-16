// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
import MobileCoreServices
import Photos
import PhotosUI

internal struct MediaHandler {
  internal weak var fileSystem: EXFileSystemInterface?
  internal let options: ImagePickerOptions

  internal func handleMedia(_ mediaInfo: MediaInfo, completion: @escaping (ImagePickerResult) -> Void) {
    let mediaType: String? = mediaInfo[UIImagePickerController.InfoKey.mediaType] as? String
    let imageType = kUTTypeImage as String
    let videoType = kUTTypeMovie as String

    switch mediaType {
    case imageType: return handleImage(mediaInfo: mediaInfo, completion: completion)
    case videoType: return handleVideo(mediaInfo: mediaInfo, completion: completion)
    default: return completion(.failure(InvalidMediaTypeException(mediaType)))
    }
  }

  @available(iOS 14, *)
  internal func handleMultipleMedia(_ selection: [PHPickerResult], completion: @escaping (ImagePickerResult) -> Void) {
    var results = [AssetInfo?](repeating: nil, count: selection.count)

    let dispatchGroup = DispatchGroup()
    let dispatchQueue = DispatchQueue(label: "expo.imagepicker.multipleMediaHandler")

    let resultHandler = { (index: Int, result: SelectedMediaResult) -> Void in
      switch result {
      case .failure(let exception):
        return completion(.failure(exception))
      case .success(let mediaInfo):
        dispatchQueue.async {
          results[index] = mediaInfo
          dispatchGroup.leave()
        }
      }
    }

    for (index, selectedItem) in selection.enumerated() {
      let itemProvider = selectedItem.itemProvider

      dispatchGroup.enter()
      if itemProvider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
        handleImage(from: selectedItem, atIndex: index, completion: resultHandler)
      } else if itemProvider.hasItemConformingToTypeIdentifier(UTType.movie.identifier) {
        handleVideo(from: selectedItem, atIndex: index, completion: resultHandler)
      } else {
        completion(.failure(InvalidMediaTypeException(itemProvider.registeredTypeIdentifiers.first)))
      }
    }

    dispatchGroup.notify(queue: .main) {
      completion(.success(
        ImagePickerResponse(assets: results.compactMap({ $0 }), canceled: false)
      ))
    }
  }

  // MARK: - Image

  // TODO: convert to async/await syntax once we drop support for iOS 12
  private func handleImage(mediaInfo: MediaInfo, completion: @escaping (ImagePickerResult) -> Void) {
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

      // as calling this already requires media library permission, we can access it here
      // if user gave limited permissions, in the worst case this will be null
      let asset = mediaInfo[.phAsset] as? PHAsset
      let fileName = asset?.value(forKey: "filename") as? String
      let fileSize = getFileSize(from: targetUrl)

      let base64 = try ImageUtils.optionallyReadBase64From(imageData: imageData,
                                                           orImageFileUrl: targetUrl,
                                                           tryReadingFile: fileWasCopied,
                                                           shouldReadBase64: self.options.base64)

      ImageUtils.optionallyReadExifFrom(mediaInfo: mediaInfo, shouldReadExif: self.options.exif) { exif in
        let imageInfo = AssetInfo(assetId: asset?.localIdentifier,
                                  uri: targetUrl.absoluteString,
                                  width: image.size.width,
                                  height: image.size.height,
                                  fileName: fileName,
                                  fileSize: fileSize,
                                  base64: base64,
                                  exif: exif)
        let response = ImagePickerResponse(assets: [imageInfo], canceled: false)
        completion(.success(response))
      }
    } catch let exception as Exception {
      return completion(.failure(exception))
    } catch {
      return completion(.failure(UnexpectedException(error)))
    }
  }

  @available(iOS 14, *)
  private func handleImage(from selectedImage: PHPickerResult,
                           atIndex index: Int = -1,
                           completion: @escaping (Int, SelectedMediaResult) -> Void) {
    let itemProvider = selectedImage.itemProvider
    itemProvider.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { rawData, error in
      do {
        guard error == nil,
              let rawData = rawData,
              let image = try? UIImage(data: rawData) else {
          return completion(index, .failure(FailedToReadImageException().causedBy(error)))
        }

        let (imageData, fileExtension) = try ImageUtils.readDataAndFileExtension(image: image,
                                                                                 rawData: rawData,
                                                                                 itemProvider: itemProvider,
                                                                                 options: self.options)

        let targetUrl = try generateUrl(withFileExtension: fileExtension)
        try ImageUtils.write(imageData: imageData, to: targetUrl)
        let fileSize = getFileSize(from: targetUrl)
        let fileName = itemProvider.suggestedName.map { $0 + fileExtension }

        // We need to get EXIF from original image data, as it is being lost in UIImage
        let exif = ImageUtils.optionallyReadExifFrom(data: rawData, shouldReadExif: self.options.exif)

        let base64 = try ImageUtils.optionallyReadBase64From(imageData: imageData,
                                                             orImageFileUrl: targetUrl,
                                                             tryReadingFile: false,
                                                             shouldReadBase64: self.options.base64)

        let imageInfo = AssetInfo(assetId: selectedImage.assetIdentifier,
                                  uri: targetUrl.absoluteString,
                                  width: image.size.width,
                                  height: image.size.height,
                                  fileName: fileName,
                                  fileSize: fileSize,
                                  base64: base64,
                                  exif: exif)
        completion(index, .success(imageInfo))
      } catch let exception as Exception {
        return completion(index, .failure(exception))
      } catch {
        return completion(index, .failure(UnexpectedException(error)))
      }
    } // loadObject
  }

  // MARK: - Video

  // TODO: convert to async/await syntax once we drop support for iOS 12
  func handleVideo(mediaInfo: MediaInfo, completion: (ImagePickerResult) -> Void) {
    do {
      guard let pickedVideoUrl = VideoUtils.readVideoUrlFrom(mediaInfo: mediaInfo) else {
        return completion(.failure(FailedToReadVideoException()))
      }

      let targetUrl = try generateUrl(withFileExtension: ".mov")

      try VideoUtils.tryCopyingVideo(at: pickedVideoUrl, to: targetUrl)

      guard let dimensions = VideoUtils.readSizeFrom(url: targetUrl) else {
        return completion(.failure(FailedToReadVideoSizeException()))
      }

      // If video was edited (the duration is affected) then read the duration from the original edited video.
      // Otherwise read the duration from the target video file.
      // TODO: (@bbarthec): inspect whether it makes sense to read duration from two different assets
      let videoUrlToReadDurationFrom = self.options.allowsEditing ? pickedVideoUrl : targetUrl
      let duration = VideoUtils.readDurationFrom(url: videoUrlToReadDurationFrom)

      let asset = mediaInfo[.phAsset] as? PHAsset
      let fileName = asset?.value(forKey: "filename") as? String
      let fileSize = getFileSize(from: targetUrl)
      let videoInfo = AssetInfo(assetId: asset?.localIdentifier,
                                type: "video",
                                uri: targetUrl.absoluteString,
                                width: dimensions.width,
                                height: dimensions.height,
                                fileName: fileName,
                                fileSize: fileSize,
                                duration: duration)

      completion(.success(ImagePickerResponse(assets: [videoInfo], canceled: false)))
    } catch let exception as Exception {
      return completion(.failure(exception))
    } catch {
      return completion(.failure(UnexpectedException(error)))
    }
  }

  @available(iOS 14, *)
  private func handleVideo(from selectedVideo: PHPickerResult,
                           atIndex index: Int = -1,
                           completion: @escaping (Int, SelectedMediaResult) -> Void) {
    let itemProvider = selectedVideo.itemProvider
    itemProvider.loadFileRepresentation(forTypeIdentifier: UTType.movie.identifier) { [self] url, error in
      do {
        guard error == nil,
              let videoUrl = url as? URL else {
          return completion(index, .failure(FailedToReadVideoException().causedBy(error)))
        }

        // In case of passthrough, we want original file extension, mp4 otherwise
        // TODO: (barthap) Support other file extensions?
        let transcodeFileType = AVFileType.mp4
        let transcodeFileExtension = ".mp4"
        let originalExtension = ".\(videoUrl.pathExtension)"

        // We need to copy the result into a place that we control, because the picker
        // can remove the original file during conversion.
        // Also, the transcoding may need a separate url - one of these will be used as a final result
        let assetUrl = try generateUrl(withFileExtension: originalExtension)
        let transcodedUrl = try generateUrl(withFileExtension: transcodeFileExtension)
        try VideoUtils.tryCopyingVideo(at: videoUrl, to: assetUrl)

        VideoUtils.transcodeVideoAsync(sourceAssetUrl: assetUrl,
                                       destinationUrl: transcodedUrl,
                                       outputFileType: transcodeFileType,
                                       exportPreset: options.videoExportPreset) { result in
          switch result {
          case .failure(let exception):
            return completion(index, .failure(exception))
          case .success(let targetUrl):
            let fileName = itemProvider.suggestedName.map { $0 + transcodeFileExtension }
            let videoResult = buildVideoResult(for: targetUrl, withName: fileName, assetId: selectedVideo.assetIdentifier)
            return completion(index, videoResult)
          }
        }
      } catch let exception as Exception {
        return completion(index, .failure(exception))
      } catch {
        return completion(index, .failure(UnexpectedException(error)))
      }
    }
  }

  // MARK: - utils

  private func generateUrl(withFileExtension: String) throws -> URL {
    guard let fileSystem = self.fileSystem else {
      throw FileSystemModuleNotFoundException()
    }
    let directory =  fileSystem.cachesDirectory.appending(
      fileSystem.cachesDirectory.hasSuffix("/") ? "" : "/" + "ImagePicker"
    )
    let path = fileSystem.generatePath(inDirectory: directory, withExtension: withFileExtension)
    let url = URL(fileURLWithPath: path)
    return url
  }

  private func buildVideoResult(for videoUrl: URL, withName fileName: String?, assetId: String?) -> SelectedMediaResult {
    guard let size = VideoUtils.readSizeFrom(url: videoUrl) else {
      return .failure(FailedToReadVideoSizeException())
    }
    let duration = VideoUtils.readDurationFrom(url: videoUrl)
    let fileSize = getFileSize(from: videoUrl)

    let result = AssetInfo(assetId: assetId,
                           type: "video",
                           uri: videoUrl.absoluteString,
                           width: size.width,
                           height: size.height,
                           fileName: fileName,
                           fileSize: fileSize,
                           duration: duration)
    return .success(result)
  }

  private func getFileSize(from fileUrl: URL) -> Int? {
    do {
      let resources = try fileUrl.resourceValues(forKeys: [.fileSizeKey])
      return resources.fileSize
    } catch {
      log.error("Failed to get file size for \(fileUrl.absoluteString)")
      return nil
    }
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
      var rawData: Data?
      if let imgUrl = mediaInfo[.imageURL] as? URL {
         rawData = try? Data(contentsOf: imgUrl)
      }
      let inputData = rawData ?? image.jpegData(compressionQuality: compressionQuality)
      let metadata = mediaInfo[.mediaMetadata] as? [String: Any]
      let cropRect = options.allowsEditing ? mediaInfo[.cropRect] as? CGRect : nil
      let gifData = try processGifData(inputData: inputData,
                                       compressionQuality: options.quality,
                                       initialMetadata: metadata,
                                       cropRect: cropRect)
      return (gifData, ".gif")
    default:
      let data = image.jpegData(compressionQuality: compressionQuality)
      return (data, ".jpg")
    }
  }

  @available(iOS 14, *)
  static func readDataAndFileExtension(
    image: UIImage,
    rawData: Data,
    itemProvider: NSItemProvider,
    options: ImagePickerOptions
  ) throws -> (imageData: Data?, fileExtension: String) {
    let compressionQuality = options.quality ?? DEFAULT_QUALITY
    let preferredFormat = itemProvider.registeredTypeIdentifiers.first

    switch preferredFormat {
    case UTType.png.identifier:
      let data = image.pngData()
      return (data, ".png")
    case UTType.gif.identifier:
      let gifData = try processGifData(inputData: rawData,
                                       compressionQuality: options.quality,
                                       initialMetadata: nil)
      return (gifData, ".gif")
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
    completion: @escaping (_ result: ExifInfo?) -> Void
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
      log.error("Could not fetch metadata for image")
      return completion(nil)
    }

    let assets = PHAsset.fetchAssets(withALAssetURLs: [imageUrl], options: nil)

    guard let asset = assets.firstObject else {
      log.error("Could not fetch metadata for image '\(imageUrl.absoluteString)'.")
      return completion(nil)
    }

    let options = PHContentEditingInputRequestOptions()
    options.isNetworkAccessAllowed = true
    asset.requestContentEditingInput(with: options) { input, info in
      guard let imageUrl = input?.fullSizeImageURL,
            let properties = CIImage(contentsOf: imageUrl)?.properties
      else {
        log.error("Could not fetch metadata for '\(imageUrl.absoluteString)'.")
        return completion(nil)
      }
      let exif = ImageUtils.readExifFrom(imageMetadata: properties)
      return completion(exif)
    }
  }

  static func optionallyReadExifFrom(data: Data, shouldReadExif: Bool) -> ExifInfo? {
    if shouldReadExif,
       let cgImageSource = CGImageSourceCreateWithData(data as CFData, nil),
       let properties = CGImageSourceCopyPropertiesAtIndex(cgImageSource, 0, nil) {
      return ImageUtils.readExifFrom(imageMetadata: properties as! [String: Any])
    }
    return nil
  }

  static func readExifFrom(imageMetadata: [String: Any]) -> ExifInfo {
    var exif: ExifInfo = imageMetadata[kCGImagePropertyExifDictionary as String] as? ExifInfo ?? [:]

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

  static func processGifData(
    inputData: Data?,
    compressionQuality: Double?,
    initialMetadata: [String: Any]?,
    cropRect: CGRect? = nil
  ) throws -> Data? {
    let quality = compressionQuality ?? MAXIMUM_QUALITY
    // for uncropped, maximum quality image we can just pass through the raw data
    if cropRect == nil && quality >= MAXIMUM_QUALITY {
      return inputData
    }

    guard let sourceData = inputData,
          let imageSource = CGImageSourceCreateWithData(sourceData as CFData, nil)
    else {
      throw FailedToReadImageException()
    }

    let gifProperties = CGImageSourceCopyProperties(imageSource, nil) as? [String: Any]
    let frameCount = CGImageSourceGetCount(imageSource)

    let destinationData = NSMutableData()
    guard let imageDestination = CGImageDestinationCreateWithData(destinationData, kUTTypeGIF, frameCount, nil)
    else {
      throw FailedToCreateGifException()
    }

    let gifMetadata = initialMetadata ?? gifProperties
    CGImageDestinationSetProperties(imageDestination, gifMetadata as CFDictionary?)

    for frameIndex in 0 ..< frameCount {
      guard var cgImage = CGImageSourceCreateImageAtIndex(imageSource, frameIndex, nil),
            var frameProperties = CGImageSourceCopyPropertiesAtIndex(imageSource, frameIndex, nil) as? [String: Any]
      else {
        throw FailedToCreateGifException()
      }
      if cropRect != nil {
        cgImage = cgImage.cropping(to: cropRect!)!
      }
      if quality != nil {
        frameProperties[kCGImageDestinationLossyCompressionQuality as String] = quality
      }
      CGImageDestinationAddImage(imageDestination, cgImage, frameProperties as CFDictionary)
    }

    if !CGImageDestinationFinalize(imageDestination) {
      throw FailedToExportGifException()
    }
    return destinationData as Data
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

  /**
   Asynchronously transcodes asset provided as `sourceAssetUrl` according to `exportPreset`.
   Result URL is returned to the `completion` closure.
   Transcoded video is saved at `destinationUrl`, unless `exportPreset` is set to `passthrough`.
   In this case, `sourceAssetUrl` is returned.
   */
  static func transcodeVideoAsync(sourceAssetUrl: URL,
                                  destinationUrl: URL,
                                  outputFileType: AVFileType,
                                  exportPreset: VideoExportPreset,
                                  completion: @escaping (Result<URL, Exception>) -> Void) {
    if case .passthrough = exportPreset {
      return completion(.success((sourceAssetUrl)))
    }

    let asset = AVURLAsset(url: sourceAssetUrl)
    let preset = exportPreset.toAVAssetExportPreset()
    AVAssetExportSession.determineCompatibility(ofExportPreset: preset,
                                                with: asset,
                                                outputFileType: outputFileType) { canBeTranscoded in
      guard canBeTranscoded else {
        return completion(.failure(UnsupportedVideoExportPresetException(preset.description)))
      }
      guard let exportSession = AVAssetExportSession(asset: asset,
                                                     presetName: preset) else {
        return completion(.failure(FailedToTranscodeVideoException()))
      }
      exportSession.outputFileType = outputFileType
      exportSession.outputURL = destinationUrl
      exportSession.exportAsynchronously {
        switch exportSession.status {
        case .failed:
          let error = exportSession.error
          completion(.failure(FailedToTranscodeVideoException().causedBy(error)))
        default:
          completion(.success((destinationUrl)))
        }
      }
    }
  }
}
