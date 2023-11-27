import ExpoModulesCore

struct CameraRecordingOptions: Record {
  @Field var maxDuration: Double?
  @Field var maxFileSize: Double?
  @Field var quality: VideoQuality?
  @Field var mute: Bool = false
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
