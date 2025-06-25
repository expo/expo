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
    
//    Menu-only
    var children: [LinkPreviewNativeActionView] = []
    
    
    /// Show children inline in parent, instead of hierarchically
    var displayInline: Bool = false;
    
    /// Indicates whether the menu (and any submenus) should only allow a single "on" menu item.
    var singleSelection: Bool = false;


    /// Indicates that this menu should be rendered as a palette.
    /// @available(iOS 17.0, *)
    var displayAsPalette: Bool = false
    
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }
}
