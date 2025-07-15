import ExpoModulesCore
import WebKit

class LinkPreviewNativeActionView: ExpoView {
  var id: String = ""
  var title: String = ""
  var icon: String?
  var subActions: [LinkPreviewNativeActionView] = []

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let childActionView = childComponentView as? LinkPreviewNativeActionView {
      subActions.append(childActionView)
    } else {
      print(
        "ExpoRouter: Unknown child component view (\(childComponentView)) mounted to NativeLinkPreviewActionView"
      )
    }
  }

  override func unmountChildComponentView(_ child: UIView, index: Int) {
    if let childActionView = child as? LinkPreviewNativeActionView {
      subActions.removeAll(where: { $0 == childActionView })
    } else {
      print(
        "ExpoRouter: Unknown child component view (\(child)) unmounted from NativeLinkPreviewActionView"
      )
    }
  }
}
