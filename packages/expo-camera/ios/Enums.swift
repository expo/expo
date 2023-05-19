import AVFoundation
import ExpoModulesCore

enum CameraWhiteBalance: Int {
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

enum CameraVideoResolution: Int, Enumerable {
  case video2160p
  case video1080p
  case video720p
  case video4x3
  
  func resolution() -> AVCaptureSession.Preset {
    switch self {
    case .video2160p:
      return .hd4K3840x2160
    case .video1080p:
      return .hd1920x1080
    case .video720p:
      return .hd1280x720
    case .video4x3:
      return .vga640x480
    default:
      return .high
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

enum CameraAutoFocus: Int {
  case on
  case off
}

enum CameraFlashMode: Int, Enumerable {
  case off = 0
  case on = 1
  case torch = 2
  case auto = 3
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

