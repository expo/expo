struct ExpoCameraUtils {
  static func device(with mediaType: AVMediaType, preferring position: AVCaptureDevice.Position) -> AVCaptureDevice? {
    return AVCaptureDevice.default(.builtInWideAngleCamera, for: mediaType, position: position)
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
      return .landscapeLeft
    case .landscapeRight:
      return .landscapeRight
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
      text.draw(with: CGRect(x: size.width * 0.1, y: size.height * 0.9, width: size.width, height: size.height), attributes: [.font: UIFont.systemFont(ofSize: 18), .foregroundColor: UIColor.orange], context: nil)
    }
  }

  static func crop(image: UIImage, to rect: CGRect) -> UIImage {
    let cgImage = image.cgImage
    guard let croppedCgImage = cgImage?.cropping(to: rect) else { return image }
    return UIImage(cgImage: croppedCgImage)
  }

  static func writeImage(data: Data, to path: String?) -> String? {
    guard let path else { return nil }
    guard let url = URL(string: path) else { return nil }
    try? data.write(to: url)
    let fileUrl = URL(fileURLWithPath: path)
    return fileUrl.absoluteString
  }
}
