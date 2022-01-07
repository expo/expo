// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
import MobileCoreServices
import Photos

internal struct MediaHandler {
  internal let fileSystem: EXFileSystemInterface
  internal let logger: EXLogManager
  internal let pickingOptions: PickingOptions
  
  internal func handleMedia(_ mediaInfo: MediaInfo, completion: @escaping (Result) -> Void) {
    let mediaType: String? = mediaInfo[UIImagePickerController.InfoKey.mediaType] as! String?
    let imageType = kUTTypeImage as String
    let videoType = kUTTypeMovie as String
  
    switch (mediaType) {
    case imageType: return self.handleImage(mediaInfo: mediaInfo, completion: completion)
    case videoType: return self.handleVideo(mediaInfo: mediaInfo, completion: completion)
    default: return completion(.Failure(UnhandledMediaTypeError(mediaType: mediaType)))
    }
  }
  
  // MARK: Image
  
  // TODO: convert to async/await syntax once we drop support for iOS 12
  private func handleImage(mediaInfo: MediaInfo, completion: @escaping (Result) -> Void) {
    let metadata = mediaInfo[.mediaMetadata] as! Dictionary<String, Any>?
    let imageUrl = mediaInfo[.referenceURL] as! URL

    var image = mediaInfo[.originalImage] as! UIImage
    image = image.fixOrientation()
    
    let cropRect = mediaInfo[.cropRect] as! CGRect
    image = pickingOptions.allowsEditing ? self.cropImage(image, to: cropRect) : image

    let data: Data?
    let fileExtension: String
    do {
      (data, fileExtension) = try self.readImageData(image: image,
                                                     url: imageUrl,
                                                     metadata: metadata)
    } catch let error as CodedError {
      return completion(.Failure(error))
    } catch {
      return completion(.Failure(UnexpectedError(error)))
    }


    let path = self.generateDestinationPath(withExtension: fileExtension)
    let fileUrl = URL.init(fileURLWithPath: path)

    var fileCopied = false
    if (!pickingOptions.allowsEditing && pickingOptions.quality == nil) {
      // no modifiation requested
      fileCopied = self.tryCopyImage(mediaInfo: mediaInfo, path:path)
    }

    if (!fileCopied) {
      do {
        try data?.write(to: fileUrl, options: [.atomic])
      } catch {
        return completion(.Failure(FailedToWriteImageError(reason: error)))
      }
    }

    let getImageDataToStringify: () throws -> Data = {
      if (fileCopied) {
        do {
          let imageData = try Data.init(contentsOf: fileUrl)
          return imageData
        } catch {
          throw FailedToReadImageDataError(reason: error)
        }
      }
      if (data == nil) {
        throw FailedToReadImageDataForBase64Error()
      }
      return data!
    }

    let base64: String?
    do {
      base64 = self.pickingOptions.base64 ? self.imageToBase64(imageData: try getImageDataToStringify()) : nil
    } catch let error as CodedError {
      return completion(.Failure(error))
    } catch {
      return completion(.Failure(UnexpectedError(error)))
    }
    
    
    let completionHandler: (_ exif: [String: Any]?) -> Void = { exif in
      let result: Response = .Image(ImageInfo(uri: fileUrl.absoluteString,
                                              width: image.size.width,
                                              height: image.size.height,
                                              base64: base64,
                                              exif: exif))
      completion(.Success(result))
    }
    
    if (self.pickingOptions.exif) {
      return self.readImageExif(mediaInfo: mediaInfo, completion: completionHandler)
    }
    
    return completionHandler(nil)
  }
  
  private func cropImage(_ image: UIImage, to: CGRect) -> UIImage {
    let cgImage = image.cgImage!.cropping(to: to)!
    return UIImage.init(cgImage: cgImage,
                        scale: image.scale,
                        orientation: image.imageOrientation)
  }
  
  private func readImageData(image: UIImage,
                             url: URL,
                             metadata: [String: Any]?) throws -> (data: Data?, fileExtension: String) {
    let compressionQuality = self.pickingOptions.quality ?? DEFAULT_QUALITY

    switch (url.absoluteString) {
    case let s where s.contains("ext=PNG"):
      let data = image.pngData()
      return (data, ".png")

    case let s where s.contains("ext=BMP"):
      if (self.pickingOptions.allowsEditing || self.pickingOptions.quality != nil) {
        // switch to png if editing
        let data = image.pngData()
        return (data, ".png")
      }

      return (nil, ".bmp")

    case let s where s.contains("ext=GIF"):
      let data = image.jpegData(compressionQuality: compressionQuality)
      let imageDestination = CGImageDestinationCreateWithData(data as! CFMutableData, kUTTypeGIF, 1, nil)

      guard imageDestination != nil else {
        throw FailedToCreateGifError()
      }

      var metadata = metadata ?? [:]
      if (self.pickingOptions.quality != nil) {
        metadata[kCGImageDestinationLossyCompressionQuality as String] = self.pickingOptions.quality
      }

      CGImageDestinationAddImage(imageDestination!, image.cgImage!, metadata as CFDictionary)

      if (!CGImageDestinationFinalize(imageDestination!)) {
        throw FailedToExportGifError()
      }

      return (data, ".gif")

    default:
      let data = image.jpegData(compressionQuality: compressionQuality)
      return (data, ".jpg")
    }
  }
  
  private func tryCopyImage(mediaInfo: MediaInfo, path: String) -> Bool {
    guard let fromPath = (mediaInfo[UIImagePickerController.InfoKey.imageURL] as! URL?)?.path else {
      return false
    }

    do {
      try FileManager.default.copyItem(atPath: fromPath, toPath: path)
      return true
    } catch {
      return false
    }
  }
  
  private func imageToBase64(imageData: Data) -> String {
    return imageData.base64EncodedString(options:[])
  }
  
  // TODO: convert to async/await syntax once we drop support for iOS 12
  private func readImageExif(mediaInfo: MediaInfo, completion: @escaping ([String: Any]?) -> Void) {
    let metadata = mediaInfo[.mediaMetadata] as! Dictionary<String, Any>?
    
    if (metadata != nil) {
      let exif = self.readExifFrom(imageMetadata: metadata!)
      return completion(exif)
    }
    
    let imageUrl = mediaInfo[.referenceURL] as! URL
    let assets = PHAsset.fetchAssets(withALAssetURLs: [imageUrl], options: nil)

    guard let asset = assets.firstObject else {
      self.logger.info("Could not fetch metadata for image '\(imageUrl.absoluteString)'.")
      return completion(nil)
    }

    let options = PHContentEditingInputRequestOptions()
    options.isNetworkAccessAllowed = true
    asset.requestContentEditingInput(with: options) { input, info in
      guard let imageUrl = input?.fullSizeImageURL,
            let properties = CIImage.init(contentsOf: imageUrl)?.properties
      else {
        self.logger.info("Could not fetch metadata for '\(imageUrl.absoluteString)'.")
        return completion(nil)
      }
      let exif = self.readExifFrom(imageMetadata:properties)
      return completion(exif)
    }
  }
  
  private func readExifFrom(imageMetadata: [String: Any]) -> [String: Any] {
    var exif = imageMetadata[kCGImagePropertyExifDictionary as String] as! [String: Any]

    // Copy ["{GPS}"]["<tag>"] to ["GPS<tag>"]
    let gps = imageMetadata[kCGImagePropertyGPSDictionary as String] as! [String: Any]?
    if (gps != nil) {
      gps!.forEach { (key, value) in
        exif["GPD\(key)"] = value
      }
    }

    // Inject orientation into exif
    let orientationKey = kCGImagePropertyOrientation as String
    let orientationValue = imageMetadata[orientationKey]
    if (orientationValue != nil) {
      exif[orientationKey] = orientationValue
    }

    return exif
  }

  // MARK: Video

  // TODO: convert to async/await syntax once we drop support for iOS 12
  func handleVideo(mediaInfo: MediaInfo, completion: (Result) -> Void) {
    guard let originalVideoUrl = mediaInfo[.mediaURL] as! URL?
                              ?? mediaInfo[.referenceURL] as! URL? else { return completion(.Failure(FailedToOpenVideoError())) }

    let destinationPath = self.generateDestinationPath(withExtension: ".mov")
    let destinationFileUrl: URL = URL.init(fileURLWithPath: destinationPath)

    do {
      // we copy the file as `moveItem(at:,to:)` throws an error in iOS 13 due to missing permissions
      try FileManager.default.copyItem(at: originalVideoUrl, to: destinationFileUrl)
    } catch {
      return completion(.Failure(FailedToPickVideo(reason: error)))
    }

    // Adding information about asset
    let asset = AVURLAsset.init(url: destinationFileUrl)
    guard let size: CGSize = asset.tracks(withMediaType: .video).first?.naturalSize else {
      return completion(.Failure(FailedToReadVideoSize()))
    }

    let uri = destinationFileUrl.absoluteString
    let width = size.width
    let height = size.height

    // If video was edited (the duration is affected) then read the duration from the original edited video.
    // Otherwise read the duration from the final video.
    let videoAssetToReadDurationFrom = self.pickingOptions.allowsEditing ? AVURLAsset.init(url: originalVideoUrl) : asset
    let duration = self.readVideoAssetDuration(videoAssetToReadDurationFrom)

    let result: Response = .Video(VideoInfo(uri: uri,
                                            width: width,
                                            height: height,
                                            duration: duration))
    completion(.Success(result))
  }

  private func readVideoAssetDuration(_ asset: AVURLAsset) -> Double {
    return Double(asset.duration.value) / Double(asset.duration.timescale) * 1000 // miliseconds
  }
  
  // MARK: utils
  
  private func generateDestinationPath(withExtension fileExtension: String) -> String {
    let directory = self.fileSystem.cachesDirectory.appending("ImagePicker")
    return self.fileSystem.generatePath(inDirectory: directory, withExtension: fileExtension)
  }
}
