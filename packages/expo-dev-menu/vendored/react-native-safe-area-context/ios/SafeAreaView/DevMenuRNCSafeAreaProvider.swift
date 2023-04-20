import React
import ExpoModulesCore

class SafeAreaProvider: ExpoView {
  private var _currentSafeAreaInsets: UIEdgeInsets = .zero
  private var _currentFrame: CGRect = .zero
  private var _initialInsetsSent: Bool = false
  let onInsetsChange = EventDispatcher()

  override func safeAreaInsetsDidChange() {
    invalidateSafeAreaInsets()
  }

  func invalidateSafeAreaInsets() {
    guard !frame.size.equalTo(.zero) else {
      return
    }

    let safeAreaInsets = safeAreaInsetsOrEmulate()
    let frame = convert(bounds, to: nil)

    if _initialInsetsSent &&
      DevMenuUIEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / RCTScreenScale()) &&
      frame.equalTo(_currentFrame) {
      return
    }

    _initialInsetsSent = true
    _currentSafeAreaInsets = safeAreaInsets
    _currentFrame = frame

    onInsetsChange([
      "insets": [
        "top": safeAreaInsets.top,
        "right": safeAreaInsets.right,
        "bottom": safeAreaInsets.bottom,
        "left": safeAreaInsets.left
      ],
      "frame": [
        "x": frame.origin.x,
        "y": frame.origin.y,
        "width": frame.size.width,
        "height": frame.size.height
      ]
    ])
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    invalidateSafeAreaInsets()
  }
}
