import ExpoModulesCore
import WebKit

class LinkPreviewNativeActionView: ExpoView {
  var id: String = ""
  var title: String = ""
  var icon: String?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }
}
