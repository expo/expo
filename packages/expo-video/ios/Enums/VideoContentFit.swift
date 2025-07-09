import ExpoModulesCore

internal enum VideoContentFit: String, Enumerable {
  /**
   The video is scaled to maintain its aspect ratio while fitting within the container's box.
   The entire video is made to fill the box, while preserving its aspect ratio,
   so the video will be "letterboxed" if its aspect ratio does not match the aspect ratio of the box.
   */
  case contain

  /**
   The video is sized to maintain its aspect ratio while filling the element's entire content box.
   If the video's aspect ratio does not match the aspect ratio of its box, then the object will be clipped to fit.
   */
  case cover

  /**
   The video is sized to fill the element's content box. The entire object will completely fill the box.
   If the video's aspect ratio does not match the aspect ratio of its box, then the video will be stretched to fit.
   */
  case fill

  // TODO: Add `none` and `scaleDown`

  /**
   `VideoContentFit` cases can be directly translated to the native `AVLayerVideoGravity`
   except `scaleDown` that needs to be handled differently at the later step of rendering.
   */
  func toVideoGravity() -> AVLayerVideoGravity {
    switch self {
    case .contain:
      return .resizeAspect
    case .cover:
      return .resizeAspectFill
    case .fill:
      return .resize
    }
  }
}
