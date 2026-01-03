import ExpoModulesCore
import UIKit

class RouterToolbarItemView: RouterViewWithLogger {
  var identifier: String = ""
  // Properties requiring full rebuild
  @ReactiveProp(needsFullRebuild: true) var type: ItemType?
  @ReactiveProp(needsFullRebuild: true) var customView: UIView?

  // Properties allowing in-place updates
  @ReactiveProp var title: String?
  @ReactiveProp var systemImageName: String?
  @ReactiveProp var customTintColor: UIColor?
  @ReactiveProp var hidesSharedBackground: Bool = false
  @ReactiveProp var sharesBackground: Bool = true
  @ReactiveProp var barButtonItemStyle: UIBarButtonItem.Style?
  @ReactiveProp var width: Double?

  @ReactiveProp var selected: Bool = false
  @ReactiveProp var possibleTitles: Set<String>?
  @ReactiveProp var badgeConfiguration: BadgeConfiguration?
  @ReactiveProp var titleStyle: TitleStyle?
  @ReactiveProp var routerAccessibilityLabel: String?
  @ReactiveProp var routerAccessibilityHint: String?
  @ReactiveProp var disabled: Bool = false

  // Using "routerHidden" to avoid conflict with UIView's "isHidden"
  // This property is not applied in this component, but read by the host
  @ReactiveProp var routerHidden: Bool = false

  var host: RouterToolbarHostView?
  private var currentBarButtonItem: UIBarButtonItem?

  let onSelected = EventDispatcher()

  func performRebuild() {
    // There is no need to rebuild if not mounted
    guard self.host != nil else { return }
    rebuildBarButtonItem()
    self.host?.updateToolbarItems()
  }

  func performUpdate() {
    // There is no need to update if not mounted
    guard self.host != nil else { return }
    updateBarButtonItem()
    // Even though we update in place, we need to notify the host
    // so the toolbar array reference is updated and UIKit refreshes
    self.host?.updateToolbarItems()
  }

  @objc func handleAction() {
    onSelected()
  }

  var barButtonItem: UIBarButtonItem {
    if let item = currentBarButtonItem {
      return item
    }
    // If no item exists yet, create one
    rebuildBarButtonItem()
    return currentBarButtonItem ?? UIBarButtonItem()
  }

  private func updateBarButtonItem() {
    guard let item = currentBarButtonItem else {
      // If no current item exists, create one
      rebuildBarButtonItem()
      self.host?.updateToolbarItem(withId: self.identifier)
      return
    }

    // Update content properties (title, image, etc.) for normal buttons
    applyContentProperties(to: item)

    // Update all common properties
    applyCommonProperties(to: item)
  }

  private func rebuildBarButtonItem() {
    var item = UIBarButtonItem()

    if let customView {
      item = UIBarButtonItem(customView: customView)
    } else if type == .fluidSpacer {
      item = UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil)
    } else if type == .fixedSpacer {
      item = UIBarButtonItem(barButtonSystemItem: .fixedSpace, target: nil, action: nil)
    } else if type == .searchBar {
      guard #available(iOS 26.0, *), let controller = self.host?.findViewController() else {
        // Check for iOS 26, should already be guarded by the JS side, so this warning will only fire if controller is nil
        logger?.warn(
          "[expo-router] navigationItem.searchBarPlacementBarButtonItem not available. This is most likely a bug in expo-router."
        )
        currentBarButtonItem = nil
        return
      }
      guard let navController = controller.navigationController else {
        currentBarButtonItem = nil
        return
      }
      guard navController.isNavigationBarHidden == false else {
        logger?.warn(
          "[expo-router] Toolbar.SearchBarPlacement should only be used when stack header is shown."
        )
        currentBarButtonItem = nil
        return
      }

      item = controller.navigationItem.searchBarPlacementBarButtonItem
    } else {
      // Normal button - apply content properties during initial creation
      applyContentProperties(to: item)
    }

    // Set target and action for interactive buttons
    item.target = self
    item.action = #selector(handleAction)

    applyCommonProperties(to: item)

    currentBarButtonItem = item
  }

  private func applyContentProperties(to item: UIBarButtonItem) {
    // Only apply content properties for normal buttons
    if type == .normal || type == nil {
      if let title {
        item.title = title
      }
      item.possibleTitles = possibleTitles
      if let systemImageName {
        item.image = UIImage(systemName: systemImageName)
      }
      if let tintColor = customTintColor {
        item.tintColor = tintColor
      }
      if let titleStyle {
        RouterFontUtils.setTitleStyle(fromConfig: titleStyle, for: item)
      }
    }
  }

  private func applyCommonProperties(to item: UIBarButtonItem) {
    if #available(iOS 26.0, *) {
      item.hidesSharedBackground = hidesSharedBackground
      item.sharesBackground = sharesBackground
    }
    if let barButtonItemStyle {
      item.style = barButtonItemStyle
    }
    if let width = width {
      item.width = CGFloat(width)
    }
    item.isSelected = selected
    if let routerAccessibilityLabel = routerAccessibilityLabel {
      item.accessibilityLabel = routerAccessibilityLabel
    }
    if let routerAccessibilityHint = routerAccessibilityHint {
      item.accessibilityHint = routerAccessibilityHint
    }
    item.isEnabled = !disabled
    if #available(iOS 26.0, *) {
      if let badgeConfig = badgeConfiguration {
        var badge = UIBarButtonItem.Badge.indicator()
        if let value = badgeConfig.value {
          badge = .string(value)
        }
        if let backgroundColor = badgeConfig.backgroundColor {
          badge.backgroundColor = backgroundColor
        }
        if let foregroundColor = badgeConfig.color {
          badge.foregroundColor = foregroundColor
        }
        if badgeConfig.fontFamily != nil || badgeConfig.fontSize != nil
          || badgeConfig.fontWeight != nil {
          let font = RouterFontUtils.convertTitleStyleToFont(
            TitleStyle(
              fontFamily: badgeConfig.fontFamily,
              fontSize: badgeConfig.fontSize,
              fontWeight: badgeConfig.fontWeight
            ))
          badge.font = font
        }
        item.badge = badge
      }
    }
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    guard customView == nil else {
      logger?.warn(
        "[expo-router] RouterToolbarItemView can only have one child view. This is most likely a bug in expo-router."
      )
      return
    }
    customView = childComponentView
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    if customView == childComponentView {
      childComponentView.removeFromSuperview()
      customView = nil
    }
  }
}

enum ItemType: String, Enumerable {
  case normal
  case fixedSpacer
  case fluidSpacer
  case searchBar
}

struct BadgeConfiguration: Equatable {
  var value: String?
  var backgroundColor: UIColor?
  var color: UIColor?
  var fontFamily: String?
  var fontSize: Double?
  var fontWeight: String?
}

struct TitleStyle: Equatable {
  var fontFamily: String?
  var fontSize: Double?
  var fontWeight: String?
  var color: UIColor?
}

@propertyWrapper
struct ReactiveProp<Value: Equatable> {
  private var value: Value
  let needsFullRebuild: Bool

  init(wrappedValue: Value, needsFullRebuild: Bool = false) {
    self.value = wrappedValue
    self.needsFullRebuild = needsFullRebuild
  }

  static subscript<EnclosingSelf: RouterToolbarItemView>(
    _enclosingInstance instance: EnclosingSelf,
    wrapped wrappedKeyPath: ReferenceWritableKeyPath<EnclosingSelf, Value>,
    storage storageKeyPath: ReferenceWritableKeyPath<EnclosingSelf, ReactiveProp<Value>>
  ) -> Value {
    get {
      instance[keyPath: storageKeyPath].value
    }
    set {
      let oldValue = instance[keyPath: storageKeyPath].value
      if oldValue != newValue {
        instance[keyPath: storageKeyPath].value = newValue
        if instance[keyPath: storageKeyPath].needsFullRebuild {
          instance.performRebuild()
        } else {
          instance.performUpdate()
        }
      }
    }
  }

  @available(*, unavailable, message: "Use the enclosing instance subscript.")
  var wrappedValue: Value {
    get { fatalError() }
    set { fatalError() }
  }
}

extension ReactiveProp where Value: ExpressibleByNilLiteral {
  init(needsFullRebuild: Bool = false) {
    self.value = nil
    self.needsFullRebuild = needsFullRebuild
  }
}
