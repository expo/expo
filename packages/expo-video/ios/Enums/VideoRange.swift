import ExpoModulesCore

internal enum VideoRange: String, Enumerable {
  // Standard dynamic range
  case sdr
  // Hybrid Log-Gamma - HDR backward-compatible with SDR displays
  case hlg
  // Perceptual Quantizer - Formats like HDR10 and Dolby Vision
  case pq

  static func from(videoRange range: AVVideoRange) -> VideoRange {
    switch range {
    case .hlg:
      .hlg
    case .pq:
      .pq
    default:
      .sdr
    }
  }
}
