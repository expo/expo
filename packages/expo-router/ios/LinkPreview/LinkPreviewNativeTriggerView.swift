import ExpoModulesCore
import WebKit

class NativeLinkPreviewTrigger: ExpoView {
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }
}
