import UIKit

struct CaptureRequest {
  let exif: Bool
  let quality: Double
  let imageType: PictureFormat
  let additionalExif: [String: Any]?
}

struct CapturedPhotoProcessor {
  struct Result {
    let data: Data
    let width: Double
    let height: Double
    let exif: [String: Any]?
  }

  func process(image: UIImage, sourceMetadata: [String: Any], request: CaptureRequest) throws -> Result {
    let width = image.size.width
    let height = image.size.height

    guard request.exif else {
      let data = request.imageType == .png
        ? image.pngData()
        : image.jpegData(compressionQuality: request.quality)
      guard let data else {
        throw CameraSavingImageException("Image data could not be processed")
      }
      return Result(data: data, width: width, height: height, exif: nil)
    }

    guard let exifDict = sourceMetadata[kCGImagePropertyExifDictionary as String] as? [String: Any] else {
      throw CameraSavingImageException("Failed to process EXIF data")
    }

    var updatedExif = ExpoCameraUtils.updateExif(
      metadata: exifDict,
      with: ["Orientation": ExpoCameraUtils.toExifOrientation(orientation: image.imageOrientation)]
    )
    // Pixel dimensions describe the unrotated buffer, not the display size.
    if let cgImage = image.cgImage {
      updatedExif[kCGImagePropertyExifPixelXDimension as String] = cgImage.width
      updatedExif[kCGImagePropertyExifPixelYDimension as String] = cgImage.height
    }

    var updatedMetadata = sourceMetadata
    updatedMetadata[kCGImagePropertyOrientation as String] =
      ExpoCameraUtils.toExifOrientation(orientation: image.imageOrientation)

    if let additionalExif = request.additionalExif {
      for (key, value) in additionalExif {
        updatedExif[key] = value
      }

      let gpsDict = Self.createGPSDict(additionalExif: additionalExif)
      if updatedMetadata[kCGImagePropertyGPSDictionary as String] == nil {
        updatedMetadata[kCGImagePropertyGPSDictionary as String] = gpsDict
      } else if var existingGpsDict = updatedMetadata[kCGImagePropertyGPSDictionary as String] as? [String: Any] {
        existingGpsDict.merge(gpsDict) { _, new in new }
        updatedMetadata[kCGImagePropertyGPSDictionary as String] = existingGpsDict
      }
    }

    updatedMetadata[kCGImagePropertyExifDictionary as String] = updatedExif

    guard let data = ExpoCameraUtils.data(
      from: image,
      with: updatedMetadata,
      quality: Float(request.quality)
    ) else {
      throw CameraSavingImageException("Image data could not be processed")
    }

    return Result(data: data, width: width, height: height, exif: updatedExif)
  }

  private static func createGPSDict(additionalExif: [String: Any]) -> [String: Any] {
    var gpsDict = [String: Any]()

    if let latitude = additionalExif["GPSLatitude"], let latValue = toDouble(latitude) {
      gpsDict[kCGImagePropertyGPSLatitude as String] = abs(latValue)
      gpsDict[kCGImagePropertyGPSLatitudeRef as String] = latValue >= 0 ? "N" : "S"
    }

    if let longitude = additionalExif["GPSLongitude"], let lonValue = toDouble(longitude) {
      gpsDict[kCGImagePropertyGPSLongitude as String] = abs(lonValue)
      gpsDict[kCGImagePropertyGPSLongitudeRef as String] = lonValue >= 0 ? "E" : "W"
    }

    if let altitude = additionalExif["GPSAltitude"], let altValue = toDouble(altitude) {
      gpsDict[kCGImagePropertyGPSAltitude as String] = abs(altValue)
      gpsDict[kCGImagePropertyGPSAltitudeRef as String] = altValue >= 0 ? 0 : 1
    }

    if let speed = additionalExif["GPSSpeed"], let speedValue = toDouble(speed) {
      gpsDict[kCGImagePropertyGPSSpeed as String] = speedValue
    }
    if let speedRef = additionalExif["GPSSpeedRef"] as? String {
      gpsDict[kCGImagePropertyGPSSpeedRef as String] = speedRef
    }

    if let imgDirection = additionalExif["GPSImgDirection"], let dirValue = toDouble(imgDirection) {
      gpsDict[kCGImagePropertyGPSImgDirection as String] = dirValue
    }
    if let imgDirectionRef = additionalExif["GPSImgDirectionRef"] as? String {
      gpsDict[kCGImagePropertyGPSImgDirectionRef as String] = imgDirectionRef
    }

    if let destBearing = additionalExif["GPSDestBearing"], let bearingValue = toDouble(destBearing) {
      gpsDict[kCGImagePropertyGPSDestBearing as String] = bearingValue
    }
    if let destBearingRef = additionalExif["GPSDestBearingRef"] as? String {
      gpsDict[kCGImagePropertyGPSDestBearingRef as String] = destBearingRef
    }

    if let dateStamp = additionalExif["GPSDateStamp"] as? String {
      gpsDict[kCGImagePropertyGPSDateStamp as String] = dateStamp
    }

    if let timeStamp = additionalExif["GPSTimeStamp"] as? String {
      gpsDict[kCGImagePropertyGPSTimeStamp as String] = timeStamp
    }

    if let hPositioningError = additionalExif["GPSHPositioningError"], let errorValue = toDouble(hPositioningError) {
      gpsDict[kCGImagePropertyGPSHPositioningError as String] = errorValue
    }

    return gpsDict
  }

  private static func toDouble(_ value: Any) -> Double? {
    if let doubleValue = value as? Double {
      return doubleValue
    } else if let intValue = value as? Int {
      return Double(intValue)
    } else if let floatValue = value as? Float {
      return Double(floatValue)
    }
    return nil
  }
}
