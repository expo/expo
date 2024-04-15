import AVFoundation
import ExpoModulesCore

enum CameraTypeNext: String, Enumerable {
  case front
  case back

  func toPosition() -> AVCaptureDevice.Position {
    switch self {
    case .front:
      return .front
    case .back:
      return .back
    }
  }
}

enum CameraFlashModeNext: String, Enumerable {
  case off
  case on
  case auto

  func toDeviceFlashMode() -> AVCaptureDevice.FlashMode {
    switch self {
    case .off:
      return .off
    case .on:
      return .on
    case .auto:
      return .auto
    }
  }
}

enum CameraModeNext: String, Enumerable {
  case picture
  case video
}
