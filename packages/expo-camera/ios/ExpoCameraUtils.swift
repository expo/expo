import AVFoundation
import CoreMotion

struct ExpoCameraUtils {
  static func device(with mediaType: AVMediaType, preferring position: AVCaptureDevice.Position) -> AVCaptureDevice? {
    return AVCaptureDevice.default(.builtInWideAngleCamera, for: mediaType, position: position)
  }

  static func deviceOrientation(
    for accelerometerData: CMAccelerometerData,
    default orientation: UIDeviceOrientation
  ) -> UIDeviceOrientation {
    if accelerometerData.acceleration.x >= 0.75 {
      return .landscapeRight
    }
    if accelerometerData.acceleration.x <= -0.75 {
      return .landscapeLeft
    }
    if accelerometerData.acceleration.y <= -0.75 {
      return .portrait
    }
    if accelerometerData.acceleration.y >= 0.75 {
      return .portraitUpsideDown
    }

    return orientation
}

  static func videoOrientation(for interfaceOrientaion: UIInterfaceOrientation) -> AVCaptureVideoOrientation {
    switch interfaceOrientaion {
    case .portrait:
      return .portrait
    case .landscapeLeft:
      return .landscapeLeft
    case .landscapeRight:
      return .landscapeRight
    case .portraitUpsideDown:
      return .portraitUpsideDown
    default:
      return .portrait
    }
  }

  static func videoOrientation(for deviceOrientaion: UIDeviceOrientation) -> AVCaptureVideoOrientation {
    switch deviceOrientaion {
    case .portrait:
      return .portrait
    case .portraitUpsideDown:
      return .portraitUpsideDown
    case .landscapeLeft:
      return .landscapeRight
    case .landscapeRight:
      return .landscapeLeft
    default:
      return .portrait
    }
  }

  static func export(orientation: UIImage.Orientation) -> Int {
    switch orientation {
    case .left:
      return 90
    case .right:
      return -90
    case .down:
      return 180
    default:
      return 0
    }
  }

  static func exportImage(orientation: UIImage.Orientation) -> Int {
    switch orientation {
    case .left:
      return 90
    case .right:
      return -90
    case .down:
      return 180
    default:
      return 0
    }
  }

  static func generatePhoto(of size: CGSize) -> UIImage {
    let rect = CGRect(x: 0, y: 0, width: size.width, height: size.height)
    let renderer = UIGraphicsImageRenderer(size: size)

    return renderer.image { ctx in
      UIColor.black.setFill()
      ctx.fill(rect)
      let currentDate = Date()
      let dateFormatter = DateFormatter()
      dateFormatter.dateFormat = "dd.MM.YY HH:mm:ss"
      let text = dateFormatter.string(from: currentDate)
      text.draw(
        with: CGRect(
          x: size.width * 0.1,
          y: size.height * 0.9,
          width: size.width,
          height: size.height
        ),
        attributes: [.font: UIFont.systemFont(ofSize: 18), .foregroundColor: UIColor.orange],
        context: nil
      )
    }
  }

  static func crop(image: UIImage, to rect: CGRect) -> UIImage {
    let cgImage = image.cgImage
    guard let croppedCgImage = cgImage?.cropping(to: rect) else {
      return image
    }
    return UIImage(cgImage: croppedCgImage, scale: image.scale, orientation: image.imageOrientation)
  }

  static func write(data: Data, to path: String) -> String? {
    let url = URL(fileURLWithPath: path)
    do {
      try data.write(to: url, options: .atomic)
      return url.absoluteString
    } catch {
      return nil
    }
  }

  static func data(from image: UIImage, with metadata: [String: Any], quality: Float) -> Data? {
    guard let sourceCGImageRef = image.cgImage,
    let sourceData = image.jpegData(compressionQuality: 1.0) as CFData?,
    let sourceCGImageSourceRef = CGImageSourceCreateWithData(sourceData, nil),
    let sourceMetadata = CGImageSourceCopyPropertiesAtIndex(sourceCGImageSourceRef, 0, nil) as? NSDictionary else {
      return nil
    }

    let updatedMetadata = NSMutableDictionary(dictionary: sourceMetadata)

    for (key, value) in metadata {
      updatedMetadata[key] = value
    }

    updatedMetadata.setObject(NSNumber(value: quality), forKey: kCGImageDestinationLossyCompressionQuality as NSString)
    let processedImageData = NSMutableData()

    guard let sourceType = CGImageSourceGetType(sourceCGImageSourceRef) else {
      return nil
    }

    guard let destinationCGImageRef =
      CGImageDestinationCreateWithData(processedImageData, sourceType, 1, nil) else {
      return nil
    }

    CGImageDestinationAddImage(destinationCGImageRef, sourceCGImageRef, updatedMetadata)

    if CGImageDestinationFinalize(destinationCGImageRef) {
      return processedImageData as Data
    }

    CGImageDestinationAddImage(destinationCGImageRef, sourceCGImageRef, updatedMetadata as CFDictionary)
    return CGImageDestinationFinalize(destinationCGImageRef) ? processedImageData as Data : nil
  }

  static func updateExif(metadata: NSDictionary, with additionalData: [String: Any]) -> NSMutableDictionary {
    let mutableMetadata = NSMutableDictionary(dictionary: metadata)
    mutableMetadata.addEntries(from: additionalData)

    if let gps = mutableMetadata[kCGImagePropertyGPSDictionary as String] as? [String: Any] {
      for (gpsKey, gpsValue) in gps {
        mutableMetadata["GPS" + gpsKey] = gpsValue
      }
    }

    return mutableMetadata
  }
}
