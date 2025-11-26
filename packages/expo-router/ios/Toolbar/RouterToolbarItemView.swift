import ExpoModulesCore
import UIKit

class RouterToolbarItemView: ExpoView {
  var identifier: String = ""
  var type: ItemType? {
    didSet {
      if type != oldValue {
        self.performUpdate()
      }
    }
  }
  var title: String? {
    didSet {
      if title != oldValue {
        self.performUpdate()
      }
    }
  }
  var systemImageName: String? {
    didSet {
      if systemImageName != oldValue {
        self.performUpdate()
      }
    }
  }
  var customView: UIView? {
    didSet {
      if customView != oldValue {
        self.performUpdate()
      }
    }
  }
  var customTintColor: UIColor? {
    didSet {
      if customTintColor != oldValue {
        self.performUpdate()
      }
    }
  }
  var hidesSharedBackground: Bool = false {
    didSet {
      if hidesSharedBackground != oldValue {
        self.performUpdate()
      }
    }
  }
  var sharesBackground: Bool = true {
    didSet {
      if sharesBackground != oldValue {
        self.performUpdate()
      }
    }
  }
  var barButtonItemStyle: UIBarButtonItem.Style? = nil {
    didSet {
      if barButtonItemStyle != oldValue {
        self.performUpdate()
      }
    }
  }
  var width: Double? {
    didSet {
      if width != oldValue {
        self.performUpdate()
      }
    }
  }
  // Using "routerHidden" to avoid conflict with UIView's "isHidden"
  var routerHidden: Bool = false {
    didSet {
      if routerHidden != oldValue {
        self.performUpdate()
      }
    }
  }
  var selected: Bool = false {
    didSet {
      if selected != oldValue {
        self.performUpdate()
      }
    }
  }
  var possibleTitles: Set<String>? = nil {
    didSet {
      if possibleTitles != oldValue {
        self.performUpdate()
      }
    }
  }
  var badgeConfiguration: BadgeConfiguration? = nil {
    didSet {
      if badgeConfiguration != oldValue {
        self.performUpdate()
      }
    }
  }

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
    if let customView = customView {
      item = UIBarButtonItem(customView: customView)
    } else if type == .fluidSpacer {
      item = UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil)
    } else if type == .fixedSpacer {
      item = UIBarButtonItem(barButtonSystemItem: .fixedSpace, target: nil, action: nil)
    } else {
      if let title = title {
        item.title = title
      }
      item.possibleTitles = possibleTitles
      if let systemImageName = systemImageName {
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
    if let barButtonItemStyle = barButtonItemStyle {
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
          || badgeConfig.fontWeight != nil
        {
          let font = FontUtils.createFont(
            fontFamily: badgeConfig.fontFamily,
            fontSize: badgeConfig.fontSize,
            fontWeight: badgeConfig.fontWeight)
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
