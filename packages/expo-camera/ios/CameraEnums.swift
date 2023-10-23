import AVFoundation
import ExpoModulesCore

enum CameraWhiteBalance: Int, Enumerable {
  case auto = 0
  case sunny = 1
  case cloudy = 2
  case flash = 3
  case shadow = 4
  case incandescent = 5
  case fluorescent = 6

  func temperature() -> Float {
    switch self {
    case .sunny:
      return 5200
    case .cloudy:
      return 6000
    case .shadow:
      return 7000
    case .incandescent:
      return 3000
    case .fluorescent:
      return 4200
    default:
      return 5200
    }
  }
}

enum CameraType: Int, Enumerable {
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

enum CameraAutoFocus: Int, Enumerable {
  case off = 0
  case on = 1

  func toAvAutoFocus() -> AVCaptureDevice.FocusMode {
    switch self {
    case .on:
      return .autoFocus
    case .off:
      return .locked
    default:
      return .autoFocus
    }
  }
}

enum CameraFlashMode: Int, Enumerable {
  case off = 0
  case on = 1
  case auto = 2
  case torch = 3
}

enum CameraVideoCodec: Int, Enumerable {
  case h264 = 0
  case hevc = 1
  case jpeg = 2
  case appleProRes422 = 3
  case appleProRes4444 = 4

  func codecType() -> AVVideoCodecType {
    switch self {
    case .h264:
      return .h264
    case .hevc:
      return .hevc
    case .jpeg:
      return .jpeg
    case .appleProRes422:
      return .proRes422
    case .appleProRes4444:
      return .proRes4444
    }
  }
}

enum CameraVideoStabilizationMode: Int {
  case off
  case standard
  case cinematic
  case auto
}
