import ExpoModulesCore
import WebKit

class NativeLinkPreviewContentView: ExpoView {
  var preferredContentSize: CGSize = .zero

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }

  func setInitialSize(bounds: CGRect) {
    self.setShadowNodeSize(Float(bounds.width), height: Float(bounds.height))
  }
}
