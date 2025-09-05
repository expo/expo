// Copyright 2024-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesCore
import ImageIO
import Photos
import UniformTypeIdentifiers

extension UTType {
  static var avif: UTType {
    UTType(importedAs: "public.avif")
  }
}

internal struct ImageUtils {
  static func readImageFrom(mediaInfo: MediaInfo, shouldReadCroppedImage: Bool) -> UIImage? {
    // ---------------------------------------------------------------------------
    // 1. Fast-path  (allowsEditing == true)
    // ---------------------------------------------------------------------------
    // When the user confirms a crop in the system UI, UIKit puts the final bitmap
    // – with the crop *and* the correct visual orientation already baked in –
    // under `UIImagePickerController.InfoKey.editedImage`.
    // Re-using that image means we don't have to:
    //   • translate `cropRect` into the sensor's coordinate space, nor
    //   • worry about EXIF orientation flags that differ across formats.
    // This single line therefore handles the vast majority of cases safely.
    if shouldReadCroppedImage, let systemCropped = mediaInfo[.editedImage] as? UIImage {
      return systemCropped.fixOrientation()
    }

    // ---------------------------------------------------------------------------
    // 2. Manual path  (no .editedImage available)
    // ---------------------------------------------------------------------------
    // Some edge-cases (older iOS versions, multi-selection via PHPicker, or
    // editing disabled) don't supply `.editedImage`.  In those cases we:
    //   a) pull `.originalImage`,
    //   b) apply `cropRect` *before* touching orientation, and
    //   c) call `fixOrientation()` once at the end to normalize the bitmap.
    guard let originalImage = mediaInfo[.originalImage] as? UIImage else {
      return nil
    }

    if shouldReadCroppedImage,
      let cropRect = mediaInfo[.cropRect] as? CGRect,
      let cropped = ImageUtils.crop(image: originalImage, to: cropRect) {
      // Crop first (rect is defined in the original pixel space), then rotate.
      return cropped.fixOrientation()
    }

    // No editing – only remove any EXIF orientation so JavaScript consumers see
    // an upright image.
    return originalImage.fixOrientation()
  }

  static func crop(image: UIImage, to: CGRect) -> UIImage? {
    guard let cgImage = image.cgImage?.cropping(to: to) else {
      return nil
    }
    return UIImage(cgImage: cgImage, scale: image.scale, orientation: image.imageOrientation)
  }

  static func readDataAndFileExtension(
    image: UIImage,
    mediaInfo: MediaInfo,
    options: ImagePickerOptions
  ) throws -> (imageData: Data?, fileExtension: String) {
    // nil when an image is picked from camera
    let referenceUrl = mediaInfo[.referenceURL] as? URL

    switch referenceUrl?.absoluteString {
    case .some(let s) where s.contains("ext=PNG"):
      let data = image.pngData()
      return (data, ".png")

    case .some(let s) where s.contains("ext=WEBP"):
      if options.allowsEditing {
        // switch to png if editing
        let data = image.pngData()
        return (data, ".png")
      }
      return (nil, ".webp")

    case .some(let s) where s.contains("ext=BMP"):
      if options.allowsEditing {
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
      let inputData = rawData ?? image.jpegData(compressionQuality: options.quality)
      let metadata = mediaInfo[.mediaMetadata] as? [String: Any]
      let cropRect = options.allowsEditing ? mediaInfo[.cropRect] as? CGRect : nil
      let gifData = try processGifData(
        inputData: inputData,
        compressionQuality: options.quality,
        initialMetadata: metadata,
        cropRect: cropRect
      )
      return (gifData, ".gif")
    default:
      let data = image.jpegData(compressionQuality: options.quality)
      return (data, ".jpg")
    }
  }

  static func readDataAndFileExtension(
    image: UIImage,
    rawData: Data,
    itemProvider: NSItemProvider,
    options: ImagePickerOptions
  ) throws -> (imageData: Data?, fileExtension: String) {
    let preferredFormat = itemProvider.registeredTypeIdentifiers.first

    switch preferredFormat {
    case UTType.bmp.identifier:
      if options.allowsEditing {
        // switch to png if editing
        let data = image.pngData()
        return (data, ".png")
      }
      return (rawData, ".bmp")
    case UTType.png.identifier:
      let data = image.pngData()
      return (data, ".png")
    case UTType.webP.identifier:
      if options.allowsEditing {
        // switch to png if editing
        let data = image.pngData()
        return (data, ".png")
      }
      return (rawData, ".webp")
    case UTType.gif.identifier:
      let gifData = try processGifData(
        inputData: rawData,
        compressionQuality: options.quality,
        initialMetadata: nil
      )
      return (gifData, ".gif")
    case UTType.heic.identifier:
      return (rawData, ".heic")
    case UTType.tiff.identifier:
      return (rawData, ".tiff")
    case UTType.avif.identifier:
      return (rawData, ".avif")
    default:
      if options.quality >= 1.0 {
        return (rawData, ".jpg")
      }
      let data = image.jpegData(compressionQuality: options.quality)
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
  static func readBase64From(imageData: Data?, orImageFileUrl url: URL, tryReadingFile: Bool) throws
    -> String? {
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

  static func readExifFrom(mediaInfo: MediaInfo) async -> ExifInfo? {
    let metadata = mediaInfo[.mediaMetadata] as? [String: Any]

    if let metadata {
      return ImageUtils.readExifFrom(imageMetadata: metadata)
    }

    guard let imageUrl = mediaInfo[.referenceURL] as? URL else {
      log.error("Could not fetch metadata for image")
      return nil
    }

    let assets = PHAsset.fetchAssets(withALAssetURLs: [imageUrl], options: nil)

    guard let asset = assets.firstObject else {
      log.error("Could not fetch metadata for image '\(imageUrl.absoluteString)'.")
      return nil
    }

    let options = PHContentEditingInputRequestOptions()
    options.isNetworkAccessAllowed = true

    return await withCheckedContinuation { continuation in
      asset.requestContentEditingInput(with: options) { input, _ in
        guard let imageUrl = input?.fullSizeImageURL,
          let properties = CIImage(contentsOf: imageUrl)?.properties
        else {
          log.error("Could not fetch metadata for '\(imageUrl.absoluteString)'.")
          return continuation.resume(returning: nil)
        }
        let exif = ImageUtils.readExifFrom(imageMetadata: properties)
        return continuation.resume(returning: exif)
      }
    }
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

    if let metadata {
      let exif = ImageUtils.readExifFrom(imageMetadata: metadata)
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
    asset.requestContentEditingInput(with: options) { input, _ in
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

  static func readExifFrom(data: Data) -> ExifInfo? {
    if let cgImageSource = CGImageSourceCreateWithData(data as CFData, nil) {
      if let properties = CGImageSourceCopyPropertiesAtIndex(cgImageSource, 0, nil)
        as? [String: Any] {
        return ImageUtils.readExifFrom(imageMetadata: properties)
      }
    }
    return nil
  }

  static func readExifFrom(imageMetadata: [String: Any]) -> ExifInfo {
    var exif: ExifInfo = imageMetadata[kCGImagePropertyExifDictionary as String] as? ExifInfo ?? [:]

    // Copy ["{GPS}"]["<tag>"] to ["GPS<tag>"]
    if let gps = imageMetadata[kCGImagePropertyGPSDictionary as String] as? [String: Any] {
      gps.forEach { key, value in
        exif["GPS\(key)"] = value
      }
    }

    if let tiff = imageMetadata[kCGImagePropertyTIFFDictionary as String] as? [String: Any] {
      // Inject tiff data (make, model, resolution...)
      exif.merge(tiff) { current, _ in current }
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

    guard let imageDestination = CGImageDestinationCreateWithData(destinationData, UTType.gif.identifier as CFString, frameCount, nil) else {
      throw FailedToCreateGifException()
    }

    let gifMetadata = initialMetadata ?? gifProperties
    CGImageDestinationSetProperties(imageDestination, gifMetadata as CFDictionary?)

    for frameIndex in 0..<frameCount {
      guard var cgImage = CGImageSourceCreateImageAtIndex(imageSource, frameIndex, nil) else {
        throw FailedToCreateGifException()
      }
      var frameProperties =
        CGImageSourceCopyPropertiesAtIndex(imageSource, frameIndex, nil) as? [String: Any] ?? [:]

      if let cropRect {
        cgImage = cgImage.cropping(to: cropRect) ?? cgImage
      }
      frameProperties[kCGImageDestinationLossyCompressionQuality as String] = quality
      CGImageDestinationAddImage(imageDestination, cgImage, frameProperties as CFDictionary)
    }

    if !CGImageDestinationFinalize(imageDestination) {
      throw FailedToExportGifException()
    }
    return destinationData as Data
  }

  /*
   * Extracts the visual dimensions from an image file, accounting for EXIF orientation.
   * This ensures portrait images return portrait dimensions (height > width).
   * @param url The file URL of the image to analyze
   * @return A CGSize containing the visual width and height, or nil if the dimensions cannot be determined
   */
  static func readVisualSizeFrom(url: URL) -> CGSize? {
    // Try to fetch the dimensions from the image metadata as this is the fastest way
    guard let imageSource = CGImageSourceCreateWithURL(url as CFURL, nil),
      let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil) as? [CFString: Any],
      let width = properties[kCGImagePropertyPixelWidth] as? CGFloat,
      let height = properties[kCGImagePropertyPixelHeight] as? CGFloat else {
      // Fallback: minimally decode the image using UIImage when metadata is not available
      if let img = UIImage(contentsOfFile: url.path) {
        return CGSize(width: img.size.width, height: img.size.height)
      }
      return nil
    }

    // Check EXIF orientation to determine if dimensions should be swapped
    let orientation = properties[kCGImagePropertyOrientation] as? Int ?? 1

    // Orientations 5,6,7,8 (left/right rotated) need dimension swapping
    if orientation >= 5 && orientation <= 8 {
      return CGSize(width: height, height: width) // Swap for portrait
    }

    // Keep as is for landscape
    return CGSize(width: width, height: height)
  }
}
