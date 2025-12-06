import ExpoModulesCore
import React
import UIKit

class RouterToolbarItemView: ExpoView {
  var identifier: String = ""
  @ReactiveProp var type: ItemType?
  @ReactiveProp var title: String?
  @ReactiveProp var systemImageName: String?
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
    } else {
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
          let font = RCTFont.update(
            nil,
            withFamily: badgeConfig.fontFamily,
            size: badgeConfig.fontSize != nil ? NSNumber(value: badgeConfig.fontSize!) : nil,
            weight: badgeConfig.fontWeight,
            style: nil,
            variant: nil,
            scaleMultiplier: 1.0)
          badge.font = font
        }
        // TODO: Find out why this does not work
        item.badge = badge
      }
    }

    return item
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    if customView != nil {
      print(
        "[expo-router] Warning: RouterToolbarItemView can only have one child view"
      )
      return
    }
    customView = childComponentView
    performUpdate()
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    if customView == childComponentView {
      childComponentView.removeFromSuperview()
      customView = nil
      performUpdate()
    }
  }
}

enum ItemType: String, Enumerable {
  case normal
  case fixedSpacer
  case fluidSpacer
}

struct BadgeConfiguration: Equatable {
  var value: String?
  var backgroundColor: UIColor?
  var color: UIColor?
  var fontFamily: String?
  var fontSize: Double?
  var fontWeight: String?
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
