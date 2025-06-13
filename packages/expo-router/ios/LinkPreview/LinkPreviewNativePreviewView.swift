import ExpoModulesCore
import WebKit

class LinkPreviewNativePreviewView: ExpoView {
  var preferredContentSize: CGSize = .zero
  let onSetSize = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }

  func setInitialSize(bounds: CGRect) {
    onSetSize([
      "width": bounds.width,
      "height": bounds.height
    ])
  }
}
