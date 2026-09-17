import ExpoModulesCore

/**
 Describes how the image should be resized to fit its container.
 - Note: It mirrors the CSS [`object-fit`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) property.
 */
enum ContentFit: String, Enumerable {
  /**
   The image is scaled to maintain its aspect ratio while fitting within the container's box.
   The entire image is made to fill the box, while preserving its aspect ratio,
   so the image will be "letterboxed" if its aspect ratio does not match the aspect ratio of the box.
   */
  case contain

  /**
   The image is sized to maintain its aspect ratio while filling the element's entire content box.
   If the image's aspect ratio does not match the aspect ratio of its box, then the object will be clipped to fit.
   */
  case cover

  /**
   The image is sized to fill the element's content box. The entire object will completely fill the box.
   If the image's aspect ratio does not match the aspect ratio of its box, then the image will be stretched to fit.
   */
  case fill

  /**
   The image is not resized and is centered by default.
   When specified, the exact position can be controlled with `ContentPosition`.
   */
  case none

  /**
   The image is sized as if `none` or `contain` were specified,
   whichever would result in a smaller concrete image size.
   */
  case scaleDown = "scale-down"

  #if !os(macOS)
  /**
   `ContentFit` cases can be directly translated to the native `UIView.ContentMode`
   except `scaleDown` that needs to be handled differently at the later step of rendering.
   */
  func toContentMode() -> UIView.ContentMode {
    switch self {
    case .contain:
      return .scaleAspectFit
    case .cover:
      return .scaleAspectFill
    case .fill:
      return .scaleToFill
    case .none, .scaleDown:
      return .center
    }
  }
  #else
  /**
   On macOS the image view uses `NSImageScaling` rather than `UIView.ContentMode`. `cover` has no
   direct `NSImageScaling` analog, so we map it to `.scaleProportionallyUpOrDown` (≈ contain) and
   rely on `applyContentPosition` plus the layer mask to clip overflow.
   */
  func toImageScaling() -> NSImageScaling {
    switch self {
    case .contain, .cover, .scaleDown:
      return .scaleProportionallyUpOrDown
    case .fill:
      return .scaleAxesIndependently
    case .none:
      return .scaleNone
    }
  }
  #endif
}
