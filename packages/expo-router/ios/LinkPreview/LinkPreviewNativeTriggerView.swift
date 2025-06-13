import ExpoModulesCore
import WebKit

class LinkPreviewNativeTriggerView: ExpoView {
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }
}
