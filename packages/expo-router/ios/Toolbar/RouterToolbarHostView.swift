import ExpoModulesCore
import RNScreens
import UIKit

class RouterToolbarHostView: RouterViewWithLogger, LinkPreviewMenuUpdatable {
  // Cached reference to the view controller to avoid responder chain traversal
  private weak var cachedController: RNSScreen?

  // Mutable map of toolbar items
  var toolbarItemsArray: [String] = []
  var toolbarItemsMap: [String: RouterToolbarItemView] = [:]
  var menuItemsMap: [String: LinkPreviewNativeActionView] = [:]

  // Batching state for toolbar updates
  private var hasPendingToolbarUpdate = false

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

  func updateToolbarItems() {
    // If update already scheduled, skip - the pending async block will handle it
    if hasPendingToolbarUpdate {
      return
    }

    hasPendingToolbarUpdate = true

    // Defer actual update to next run loop iteration
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      self.hasPendingToolbarUpdate = false
      self.performToolbarUpdate()
    }
  }

  private func performToolbarUpdate() {
    if let controller = self.findViewController() {
      if #available(iOS 18.0, *) {
        let items = toolbarItemsArray.compactMap { identifier -> UIBarButtonItem? in
          if let item = toolbarItemsMap[identifier] {
            if item.routerHidden {
              return nil
            }
            return item.barButtonItem
          }
          // TODO: Extract this logic to separate function
          if let menu = menuItemsMap[identifier] {
            if menu.routerHidden {
              return nil
            }
            let item = UIBarButtonItem(
              title: menu.label,
              image: menu.image,
              primaryAction: nil,
              menu: menu.uiAction as? UIMenu
            )
            // Otherwise, the menu items will be reversed in the toolbar
            item.preferredMenuElementOrder = .fixed
            if #available(iOS 26.0, *) {
              if let hidesSharedBackground = menu.hidesSharedBackground {
                item.hidesSharedBackground = hidesSharedBackground
              }
              if let sharesBackground = menu.sharesBackground {
                item.sharesBackground = sharesBackground
              }
            }
            if let titleStyle = menu.titleStyle {
              RouterFontUtils.setTitleStyle(fromConfig: titleStyle, for: item)
            }
            item.isEnabled = !menu.disabled
            if let accessibilityLabel = menu.accessibilityLabelForMenu {
              item.accessibilityLabel = accessibilityLabel
            } else if let label = menu.label {
              item.accessibilityLabel = label
            }
            if let accessibilityHint = menu.accessibilityHintForMenu {
              item.accessibilityHint = accessibilityHint
            }
            item.tintColor = menu.customTintColor
            if let style = menu.barButtonItemStyle {
              item.style = style
            }
            return item
          }
          logger?.warn(
            "[expo-router] Warning: Could not find toolbar item or menu for identifier \(identifier). This is most likely a bug in expo-router."
          )
          return nil
        }

        controller.setToolbarItems(items, animated: true)
        controller.navigationController?.setToolbarHidden(
          false, animated: true)
        return
      }
    }
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let toolbarItem = childComponentView as? RouterToolbarItemView {
      if toolbarItem.identifier.isEmpty {
        logger?.warn(
          "[expo-router] RouterToolbarItemView identifier is empty. This is most likely a bug in expo-router."
        )
        return
      }
      addRouterToolbarItemAtIndex(toolbarItem, index: index)
    } else if let menu = childComponentView as? LinkPreviewNativeActionView {
      menu.parentMenuUpdatable = self
      addMenuToolbarItemAtIndex(menu, index: index)
    } else {
      logger?.warn(
        "[expo-router] Unknown child component view (\(childComponentView)) mounted to RouterToolbarHost. This is most likely a bug in expo-router."
      )
    }
    updateToolbarItems()
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let toolbarItem = childComponentView as? RouterToolbarItemView {
      if toolbarItem.identifier.isEmpty {
        logger?.warn(
          "[expo-router] RouterToolbarItemView identifier is empty. This is most likely a bug in expo-router."
        )
        return
      }
      removeToolbarItemWithId(toolbarItem.identifier)
    } else if let menu = childComponentView as? LinkPreviewNativeActionView {
      if menu.identifier.isEmpty {
        logger?.warn(
          "[expo-router] Menu identifier is empty. This is most likely a bug in expo-router.")
        return
      }
      removeToolbarItemWithId(menu.identifier)
    } else {
      logger?.warn(
        "[expo-router] Unknown child component view (\(childComponentView)) unmounted from RouterToolbarHost. This is most likely a bug in expo-router."
      )
    }
    updateToolbarItems()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      // View was removed from window - hide toolbar and clear items
      // Use cached controller since responder chain may be broken
      if let controller = cachedController {
        controller.setToolbarItems(nil, animated: true)
      }
      cachedController = nil  // Clear cache when removed from window
    } else {
      // View was added to window - update toolbar items
      updateToolbarItems()
    }
  }

  func updateMenu() {
    updateToolbarItems()
  }

  func findViewController() -> RNSScreen? {
    if let cached = cachedController {
      return cached
    }
    var responder: UIResponder? = self
    while let r = responder {
      if let screen = r as? RNSScreen {
        cachedController = screen
        return screen
      }
      responder = r.next
    }
    return nil
  }
}
