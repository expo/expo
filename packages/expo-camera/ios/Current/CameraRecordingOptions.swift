import ExpoModulesCore

struct CameraRecordingOptions: Record {
  @Field var maxDuration: Double?
  @Field var maxFileSize: Double?
  @Field var mirror: Bool = false
  @Field var codec: VideoCodec?
}

enum VideoQuality: String, Enumerable {
  case video2160p = "2160p"
  case video1080p = "1080p"
  case video720p = "720p"
  case video480p = "480p"
  case video4x3 = "4:3"

  func toPreset() -> AVCaptureSession.Preset {
    switch self {
    case .video2160p:
      return .hd4K3840x2160
    case .video1080p:
      return .hd1920x1080
    case .video720p:
      return .hd1280x720
    case .video480p:
      return .vga640x480
    default:
      return .high
    }
  }
}

enum VideoCodec: String, Enumerable {
  case h264 = "avc1"
  case hevc = "hvc1"
  case jpeg = "jpeg"
  case appleProRes422 = "apcn"
  case appleProRes4444 = "ap4h"

  func codecType() -> AVVideoCodecType {
    switch self {
    case .h264:
      return AVVideoCodecType.h264
    case .hevc:
      return AVVideoCodecType.hevc
    case .jpeg:
      return AVVideoCodecType.jpeg
    case .appleProRes422:
      return AVVideoCodecType.proRes422
    case .appleProRes4444:
      return AVVideoCodecType.proRes4444
    }
  }
}

enum PictureSize: String, Enumerable {
  case hd4k = "3840x2160"
  case hd1920 = "1920x1080"
  case hd720 = "1280x720"
  case vga = "640x480"
  case cif = "352x288"
  case photo = "Photo"
  case high = "High"
  case medium = "Medium"
  case low = "Low"

  func toCapturePreset() -> AVCaptureSession.Preset {
    switch self {
    case .hd4k:
      return .hd4K3840x2160
    case .hd1920:
      return .hd1920x1080
    case .hd720:
      return .hd1280x720
    case .vga:
      return .vga640x480
    case .cif:
      return .cif352x288
    case .photo:
      return .photo
    case .high:
      return .high
    case .medium:
      return .medium
    case .low:
      return .low
    }
  }
}
