import ExpoModulesCore
import Photos

enum MediaSubtypeNext: String, Enumerable {
  case depthEffect
  case hdr
  case highFrameRate
  case livePhoto
  case panorama
  case screenshot
  case stream
  case timelapse
  case spatialMedia
  case videoCinematic
  case animation
  case screenRecording

  static func from(_ mediaSubtypes: PHAssetMediaSubtype) -> [MediaSubtypeNext] {
    return allCases.filter { mediaSubtypes.contains($0.toPHAssetMediaSubtype()) }
  }

  func toPHAssetMediaSubtype() -> PHAssetMediaSubtype {
    switch self {
    case .depthEffect: .photoDepthEffect
    case .hdr: .photoHDR
    case .highFrameRate: .videoHighFrameRate
    case .livePhoto: .photoLive
    case .panorama: .photoPanorama
    case .screenshot: .photoScreenshot
    case .stream: .videoStreamed
    case .timelapse: .videoTimelapse
    case .spatialMedia: .spatialMedia
    case .videoCinematic: .videoCinematic
    // The photoAnimation name requires the Xcode 27 SDK; its iOS 11+ flag is 1 << 6.
    case .animation: PHAssetMediaSubtype(rawValue: 1 << 6)
    case .screenRecording: .videoScreenRecording
    }
  }
}
