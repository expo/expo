import ExpoModulesCore

class NativeLinkPreviewContentView: RouterViewWithLogger {
  var preferredContentSize: CGSize = .zero

  func setInitialSize(bounds: CGRect) {
    self.setShadowNodeSize(Float(bounds.width), height: Float(bounds.height))
  }
}
