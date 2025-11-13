import ExpoModulesCore
import UIKit

class RouterToolbarHost: ExpoView, LinkPreviewMenuUpdatable {
  // Mutable map of toolbar items
  var toolbarItems: [String: UIBarButtonItem] = [:]
  var menuItems: [String: LinkPreviewNativeActionView] = [:]

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  func updateToolbarItems() {
    if let controller = self.findViewController() {
      // From iOS 18
      if #available(iOS 18.0, *) {
        print("Updating toolbar items in RouterToolbarHost")
        controller.toolbarItems = Array(toolbarItems.values)
        return
      }
    } else {
      print("⚠️ No navigation controller found")
    }
  }

  // On mount
  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let toolbarItem = childComponentView as? RouterToolbarItem {
      if toolbarItem.identifier.isEmpty {
        print("⚠️ RouterToolbarItem identifier is empty")
        return
      }
      var barButtonItem: UIBarButtonItem = UIBarButtonItem()
      if toolbarItem.type == "spacer" {
        barButtonItem = UIBarButtonItem(
          barButtonSystemItem: .flexibleSpace, target: nil, action: nil)
      } else {
        if toolbarItem.title != nil {
          barButtonItem.title = toolbarItem.title
        }
        if toolbarItem.systemImageName != nil {
          barButtonItem.image = UIImage(systemName: toolbarItem.systemImageName!)
        }
      }
      toolbarItems[toolbarItem.identifier] = barButtonItem
      updateToolbarItems()
    } else if let menu = childComponentView as? LinkPreviewNativeActionView {
      let barButtonItem: UIBarButtonItem = UIBarButtonItem(
        title: menu.title,
        image: menu.icon.flatMap { UIImage(systemName: $0) },
        primaryAction: nil,
        menu: menu.uiAction as? UIMenu
      )
      toolbarItems[menu.title] = barButtonItem
      menuItems[menu.title] = menu
      updateToolbarItems()
    } else {
      print(
        "ExpoRouter: Unknown child component view (\(childComponentView)) mounted to RouterToolbarHost"
      )
    }
  }

  // On unmount
  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let toolbarItem = childComponentView as? RouterToolbarItem {
      if toolbarItem.identifier.isEmpty {
        print("⚠️ RouterToolbarItem identifier is empty")
        return
      }
      toolbarItems.removeValue(forKey: toolbarItem.identifier)
      updateToolbarItems()
    } else {
      print(
        "ExpoRouter: Unknown child component view (\(childComponentView)) unmounted from RouterToolbarHost"
      )
    }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    // Update toolbar items when the view is added to the window
    updateToolbarItems()
  }

  func updateMenu() {
    // No-op
  }

  /// Walk up the responder chain to find the owning UIViewController
  private func findViewController() -> UIViewController? {
    var responder: UIResponder? = self
    while let r = responder {
      //      print("\(r)")
      if LinkPreviewNativeNavigationObjC.isRNScreen(r) {
        return r as? UIViewController
      }
      responder = r.next
    }
    return nil
  }
}

class RouterToolbarItem: ExpoView {
  var identifier: String = ""
  var type: String?
  var title: String?
  var systemImageName: String?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }
}
