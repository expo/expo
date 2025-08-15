import ExpoModulesCore
import WebKit

class NativeLinkPreviewContentView: ExpoView {
  var preferredContentSize: CGSize = .zero

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  func setInitialSize(bounds: CGRect) {
#if RCT_NEW_ARCH_ENABLED
    self.setShadowNodeSize(Float(bounds.width), height: Float(bounds.height))
#endif
  }
}
