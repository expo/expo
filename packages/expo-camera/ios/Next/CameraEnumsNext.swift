import AVFoundation
import ExpoModulesCore


enum CameraTypeNext: Int, Enumerable {
  case front = 0
  case back = 1

  func toPosition() -> AVCaptureDevice.Position {
    switch self {
    case .front:
      return .front
    case .back:
      return .back
    default:
      return .back
    }
  }
}

enum CameraFlashModeNext: Int, Enumerable {
  case off = 0
  case on = 1
  case auto = 2
}

enum CameraModeNext: String, Enumerable {
  case picture
  case video
}
