import AVFoundation


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
}
