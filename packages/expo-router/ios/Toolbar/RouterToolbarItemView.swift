import ExpoModulesCore
import RNScreens
import UIKit

class RouterToolbarItemView: RouterViewWithLogger {
  var identifier: String = ""
  @ReactiveProp var type: ItemType?
  @ReactiveProp var title: String?
  @ReactiveProp var systemImageName: String?
  var customImage: SharedRef<UIImage>? {
    didSet {
      performUpdate()
    }
  }
  @ReactiveProp var customView: UIView?
  @ReactiveProp var customTintColor: UIColor?
  @ReactiveProp var hidesSharedBackground: Bool = false
  @ReactiveProp var sharesBackground: Bool = true
  @ReactiveProp var barButtonItemStyle: UIBarButtonItem.Style?
  @ReactiveProp var width: Double?
  // Using "routerHidden" to avoid conflict with UIView's "isHidden"
  @ReactiveProp var routerHidden: Bool = false
  @ReactiveProp var selected: Bool = false
  @ReactiveProp var possibleTitles: Set<String>?
  @ReactiveProp var badgeConfiguration: BadgeConfiguration?
  @ReactiveProp var titleStyle: TitleStyle?
  @ReactiveProp var routerAccessibilityLabel: String?
  @ReactiveProp var routerAccessibilityHint: String?
  @ReactiveProp var disabled: Bool = false
  @ReactiveProp var searchBar: RNSSearchBar?

  var host: RouterToolbarHostView?

  let onSelected = EventDispatcher()

  func performUpdate() {
    self.host?.updateToolbarItem(withId: self.identifier)
  }

  @objc func handleAction() {
    onSelected()
  }

  var barButtonItem: UIBarButtonItem {
    var item = UIBarButtonItem()
    if let customView {
      item = UIBarButtonItem(customView: customView)
    } else if type == .fluidSpacer {
      item = UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil)
    } else if type == .fixedSpacer {
      item = UIBarButtonItem(barButtonSystemItem: .fixedSpace, target: nil, action: nil)
    } else if type == .searchBar {
      if #available(iOS 16, *) {
        // Hide the item if no search bar is provided
        item.isHidden = true
      }
      guard let searchBar = searchBar, let searchController = searchBar.controller else {
        logger?.warn(
          "[expo-router] Toolbar.SearchBar requires a child SearchBar component. This is most likely a bug in expo-router."
        )
        return item
      }
      guard #available(iOS 26.0, *), let controller = self.host?.findViewController() else {
        // Check for iOS 26, should already be guarded by the JS side, so this warning will only fire if controller is nil
        logger?.warn(
          "[expo-router] navigationItem.searchBarPlacementBarButtonItem not available. This is most likely a bug in expo-router."
        )
        return item
      }
      guard controller.navigationItem.searchController == nil else {
        logger?.warn(
          "[expo-router] Only one SearchBar can be used. When using Toolbar.SearchBar remove searchBarOptions from header options and make sure only single Toolbar.SearchBar is used."
        )
        return item
      }

      controller.navigationItem.searchController = searchController
      item = controller.navigationItem.searchBarPlacementBarButtonItem
    } else {
      if let title {
        item.title = title
      }
      item.possibleTitles = possibleTitles
      if let customImage {
        // Use the UIImage from the SharedRef
        item.image = customImage.ref.withRenderingMode(.alwaysOriginal)
      } else if let systemImageName {
        // Fallback to SF Symbol
        item.image = UIImage(systemName: systemImageName)
      }
      if let tintColor = customTintColor {
        item.tintColor = tintColor
      }
      if let titleStyle {
        RouterFontUtils.setTitleStyle(fromConfig: titleStyle, for: item)
      }
    }
    if #available(iOS 26.0, *) {
      item.hidesSharedBackground = hidesSharedBackground
      item.sharesBackground = sharesBackground
    }
    if let barButtonItemStyle {
      item.style = barButtonItemStyle
    }
    item.target = self
    item.action = #selector(handleAction)
    if let width = width {
      item.width = CGFloat(width)
    }
    if #available(iOS 16.0, *) {
      item.isHidden = routerHidden
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

    return item
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let rnsSearchBar = childComponentView as? RNSSearchBar {
      guard self.searchBar == nil else {
        logger?.warn(
          "[expo-router] RouterToolbarItemView can only have one search bar. This is most likely a bug in expo-router."
        )
        return
      }
      searchBar = rnsSearchBar
    } else if customView != nil {
      logger?.warn(
        "[expo-router] RouterToolbarItemView can only have one child view. This is most likely a bug in expo-router."
      )
      return
    }
    customView = childComponentView
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    if let rnsSearchBar = childComponentView as? RNSSearchBar, searchBar == rnsSearchBar {
      rnsSearchBar.removeFromSuperview()
      searchBar = nil
      if let controller = self.host?.findViewController(),
        controller.navigationItem.searchController == rnsSearchBar.controller {
        controller.navigationItem.searchController = nil
      }
    } else if customView == childComponentView {
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

  init(wrappedValue: Value) {
    self.value = wrappedValue
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
        instance.performUpdate()
      }
    }
  }

  @available(*, unavailable, message: "Use the enclosing instance subscript.")
  var wrappedValue: Value {
    get { fatalError() }
    set { fatalError() }
  }
}
