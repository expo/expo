import AVFoundation
import ExpoModulesCore

enum CameraType: String, Enumerable {
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

enum FlashMode: String, Enumerable {
  case off
  case on
  case auto
  case screen

  func toDeviceFlashMode() -> AVCaptureDevice.FlashMode {
    switch self {
    case .off:
      return .off
    case .on, .screen:
      return .on
    case .auto:
      return .auto
    }
  }
}

enum CameraMode: String, Enumerable {
  case picture
  case video
}

enum FocusMode: String, Enumerable {
  case on
  case off

  func toAVCaptureFocusMode() -> AVCaptureDevice.FocusMode {
    switch self {
    case .on:
      return .autoFocus
    case .off:
      return .continuousAutoFocus
    }
  }
}

enum VideoStabilizationMode: String, Enumerable {
  case off
  case standard
  case cinematic
  case auto

  func toAVCaptureVideoStabilizationMode() -> AVCaptureVideoStabilizationMode {
    switch self {
    case .off:
      return .off
    case .standard:
      return .standard
    case .cinematic:
      return .cinematic
    case .auto:
      return .auto
    }
  }
}
