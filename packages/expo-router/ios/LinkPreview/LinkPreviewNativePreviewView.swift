import ExpoModulesCore

class NativeLinkPreviewContentView: RouterViewWithLogger {
  var preferredContentSize: CGSize = .zero

  func setInitialSize(bounds: CGRect) {
#if RCT_NEW_ARCH_ENABLED
    self.setShadowNodeSize(Float(bounds.width), height: Float(bounds.height))
#endif
  }
}
