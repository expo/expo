import ExpoModulesCore
import RNScreens
import UIKit

class RouterToolbarHostView: ExpoView, LinkPreviewMenuUpdatable {
  // Mutable map of toolbar items
  var toolbarItemsArray: [String] = []
  var toolbarItemsMap: [String: RouterToolbarItemView] = [:]
  var menuItemsMap: [String: LinkPreviewNativeActionView] = [:]

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  private func addRouterToolbarItemAtIndex(
    _ item: RouterToolbarItemView,
    index: Int
  ) {
    let identifier = item.identifier
    toolbarItemsArray.insert(identifier, at: index)
    toolbarItemsMap[identifier] = item
    item.host = self
  }

  private func addMenuToolbarItemAtIndex(
    _ item: LinkPreviewNativeActionView,
    index: Int
  ) {
    let identifier = item.identifier
    toolbarItemsArray.insert(identifier, at: index)
    menuItemsMap[identifier] = item
  }

  private func removeToolbarItemWithId(_ id: String) {
    if let index = toolbarItemsArray.firstIndex(of: id) {
      toolbarItemsArray.remove(at: index)
      toolbarItemsMap.removeValue(forKey: id)
      menuItemsMap.removeValue(forKey: id)
    }
  }

  func updateToolbarItem(withId id: String) {
    if let controller = self.findViewController() {
      let index = toolbarItemsArray.firstIndex(of: id)
      if let index = index, let item = toolbarItemsMap[id] {
        controller.toolbarItems?[index] = item.barButtonItem
      }
    }
  }

  func updateToolbarItems() {
    if let controller = self.findViewController() {
      if #available(iOS 18.0, *) {
        controller.setToolbarItems(
          toolbarItemsArray.compactMap {
            if let item = toolbarItemsMap[$0] {
              return item.barButtonItem
            }
            if let menu = menuItemsMap[$0] {
              return UIBarButtonItem(
                title: menu.title,
                image: menu.icon.flatMap { UIImage(systemName: $0) },
                primaryAction: nil,
                menu: menu.uiAction as? UIMenu
              )
            }
            print(
              "[expo-router] Warning: Could not find toolbar item or menu for identifier \($0)"
            )
            return nil
          }, animated: true)
        controller.navigationController?.setToolbarHidden(
          false, animated: true)
        return
      }
    } else {
      print(
        "[expo-router] Warning: Could not find owning UIViewController for RouterToolbarHostView")
    }
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let toolbarItem = childComponentView as? RouterToolbarItemView {
      if toolbarItem.identifier.isEmpty {
        print("[expo-router] RouterToolbarItemView identifier is empty")
        return
      }
      addRouterToolbarItemAtIndex(toolbarItem, index: index)
    } else if let menu = childComponentView as? LinkPreviewNativeActionView {
      addMenuToolbarItemAtIndex(menu, index: index)
    } else {
      print(
        "ExpoRouter: Unknown child component view (\(childComponentView)) mounted to RouterToolbarHost"
      )
    }
    updateToolbarItems()
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let toolbarItem = childComponentView as? RouterToolbarItemView {
      if toolbarItem.identifier.isEmpty {
        print("[expo-router] RouterToolbarItemView identifier is empty")
        return
      }
      removeToolbarItemWithId(toolbarItem.identifier)
    } else if let menu = childComponentView as? LinkPreviewNativeActionView {
      if menu.identifier.isEmpty {
        print("[expo-router] Menu identifier is empty")
        return
      }
      removeToolbarItemWithId(menu.identifier)
    } else {
      print(
        "ExpoRouter: Unknown child component view (\(childComponentView)) unmounted from RouterToolbarHost"
      )
    }
    updateToolbarItems()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    // Update toolbar items when the view is added to the window
    updateToolbarItems()
  }

  func updateMenu() {
    updateToolbarItems()
  }

  private func findViewController() -> RNSScreen? {
    var responder: UIResponder? = self
    while let r = responder {
      if let r = r as? RNSScreen {
        return r
      }
      responder = r.next
    }
    return nil
  }
}
