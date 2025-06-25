import ExpoModulesCore
import WebKit

class LinkPreviewNativeActionView: ExpoView {
  var id: String = ""
  var title: String = ""
  var image: String = ""
  var subtitle: String = ""
  var destructive: Bool = false
    var disabled: Bool = false
//    var hidden: Bool = false
    var persistent: Bool = false
    
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }
}
