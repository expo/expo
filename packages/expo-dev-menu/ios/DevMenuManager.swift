// Copyright 2015-present 650 Industries. All rights reserved.

import EXDevMenuInterface

class DevMenuBridgeProxyDelegate : DevMenuDelegateProtocol {
  private let bridge: RCTBridge
  
  init(_ bridge: RCTBridge) {
    self.bridge = bridge
  }
  
  public func appBridge(forDevMenuManager manager: DevMenuManagerProtocol) -> AnyObject? {
    return self.bridge;
  }
}

class Dispatch {
  static func mainSync<T>(_ closure: () -> T) -> T {
    if Thread.isMainThread {
      return closure()
    } else {
      var result: T?
      DispatchQueue.main.sync {
        result = closure()
      }
      return result!
    }
  }
}

/**
 A container for dev menu items array.
 NSMapTable requires the second generic type to be a class, so `[DevMenuItem]` is not allowed.
 */
class DevMenuItemsContainer {
  fileprivate let items: [DevMenuItem]

  fileprivate init(items: [DevMenuItem]) {
    self.items = items
  }
}

/**
 A hash map storing an array of dev menu items for specific extension.
 */
private let extensionToDevMenuItemsMap = NSMapTable<DevMenuExtensionProtocol, DevMenuItemsContainer>.weakToStrongObjects()

/**
 Manages the dev menu and provides most of the public API.
 */
@objc
open class DevMenuManager: NSObject, DevMenuManagerProtocol {
  /**
   Shared singleton instance.
   */
  @objc
  static public let shared = DevMenuManager()

  /**
   The window that controls and displays the dev menu view.
   */
  var window: DevMenuWindow?

  /**
   `DevMenuAppInstance` instance that is responsible for initializing and managing React Native context for the dev menu.
   */
  var appInstance: DevMenuAppInstance?

  /**
   Instance of `DevMenuSession` that keeps the details of the currently opened dev menu session.
   */
  public private(set) var session: DevMenuSession?

  /**
   The delegate of `DevMenuManager` implementing `DevMenuDelegateProtocol`.
   */
  @objc
  public var delegate: DevMenuDelegateProtocol? {
    didSet {
      guard DevMenuSettings.showsAtLaunch, let bridge = delegate?.appBridge?(forDevMenuManager: self) as? RCTBridge else {
        return
      }
      if bridge.isLoading {
        NotificationCenter.default.addObserver(self, selector: #selector(DevMenuManager.autoLaunch), name: DevMenuViewController.JavaScriptDidLoadNotification, object: bridge)
      } else {
        autoLaunch()
      }
    }
  }
  
  @objc
  public static func configure(withBridge bridge: AnyObject) {
    if let bridge = bridge as? RCTBridge {
      shared.delegate = DevMenuBridgeProxyDelegate(bridge)
    } else {
      fatalError("Cound't cast to RCTBrigde. Make sure that you passed `RCTBridge` to `DevMenuManager.initializeWithBridge`.")
    }
  }

  @objc
  public func autoLaunch() {
    DispatchQueue.main.async {
      self.openMenu()
    }
  }

  override init() {
    super.init()
    self.window = DevMenuWindow(manager: self)
    self.appInstance = DevMenuAppInstance(manager: self)

    DevMenuSettings.setup()
  }

  /**
   Whether the dev menu window is visible on the device screen.
   */
  @objc
  public var isVisible: Bool {
    return Dispatch.mainSync { !(window?.isHidden ?? true) }
  }

  /**
   Opens up the dev menu.
   */
  @objc
  @discardableResult
  public func openMenu() -> Bool {
    return setVisibility(true)
  }

  /**
   Sends an event to JS to start collapsing the dev menu bottom sheet.
   */
  @objc
  @discardableResult
  public func closeMenu() -> Bool {
    guard let appInstance = appInstance else {
      return false
    }
    appInstance.sendCloseEvent()
    return true
  }

  /**
   Forces the dev menu to hide. Called by JS once collapsing the bottom sheet finishes.
   */
  @objc
  @discardableResult
  public func hideMenu() -> Bool {
    return setVisibility(false)
  }

  /**
   Toggles the visibility of the dev menu.
   */
  @objc
  @discardableResult
  public func toggleMenu() -> Bool {
    return isVisible ? closeMenu() : openMenu()
  }

  // MARK: internals

  func dispatchAction(withId actionId: String) {
    guard let extensions = extensions else {
      return
    }
    for ext in extensions {
      guard let devMenuItems = loadDevMenuItems(forExtension: ext) else {
        continue
      }
      for item in devMenuItems {
        if let action = item as? DevMenuAction, action.actionId == actionId {
          if delegate?.devMenuManager?(self, willDispatchAction: action) ?? true {
            action.action()
          }
          return
        }
      }
    }
  }

  /**
   Returns an array of modules conforming to `DevMenuExtensionProtocol`.
   Bridge may register multiple modules with the same name – in this case it returns only the one that overrides the others.
   */
  var extensions: [DevMenuExtensionProtocol]? {
    guard let bridge = session?.bridge else {
      return nil
    }
    let allExtensions = bridge.modulesConforming(to: DevMenuExtensionProtocol.self) as! [DevMenuExtensionProtocol]
    let uniqueExtensionNames: [String] = Array(Set(allExtensions.map({ type(of: $0).moduleName() })))

    return uniqueExtensionNames
      .map({ bridge.module(forName: DevMenuUtils.stripRCT($0)) })
      .filter({ $0 is DevMenuExtensionProtocol }) as! [DevMenuExtensionProtocol]
  }

  /**
   Gathers `DevMenuItem`s from all dev menu extensions and returns them as an array.
   */
  var devMenuItems: [DevMenuItem] {
    var items: [DevMenuItem] = []

    extensions?.forEach({ ext in
      if let extensionItems = loadDevMenuItems(forExtension: ext) {
        items.append(contentsOf: extensionItems)
      }
    })
    return items.sorted {
      if $0.importance == $1.importance {
        return $0.label().localizedCaseInsensitiveCompare($1.label()) == .orderedAscending
      }
      return $0.importance > $1.importance
    }
  }

  /**
   Returns an array of `DevMenuAction`s returned by the dev menu extensions.
   */
  var devMenuActions: [DevMenuAction] {
    return devMenuItems.filter { $0 is DevMenuAction } as! [DevMenuAction]
  }

  /**
   Returns an array of dev menu items serialized to the dictionary.
   */
  func serializedDevMenuItems() -> [[String : Any]] {
    return devMenuItems.map({ $0.serialize() })
  }

  // MARK: delegate stubs

  /**
   Returns a bool value whether the dev menu can change its visibility.
   Returning `false` entirely disables the dev menu.
   */
  func canChangeVisibility(to visible: Bool) -> Bool {
    if isVisible == visible {
      return false
    }
    return delegate?.devMenuManager?(self, canChangeVisibility: visible) ?? true
  }

  /**
   Returns bool value whether the onboarding view should be displayed by the dev menu view.
   */
  func shouldShowOnboarding() -> Bool {
    return delegate?.shouldShowOnboarding?(manager: self) ?? !DevMenuSettings.isOnboardingFinished
  }

  @available(iOS 12.0, *)
  var userInterfaceStyle: UIUserInterfaceStyle {
    return delegate?.userInterfaceStyle?(forDevMenuManager: self) ?? UIUserInterfaceStyle.unspecified
  }

  // MARK: private

  private func loadDevMenuItems(forExtension ext: DevMenuExtensionProtocol) -> [DevMenuItem]? {
    if let itemsContainer = extensionToDevMenuItemsMap.object(forKey: ext) {
      return itemsContainer.items
    }
    if let items = ext.devMenuItems?() {
      let container = DevMenuItemsContainer(items: items)
      extensionToDevMenuItemsMap.setObject(container, forKey: ext)
      return items
    }
    return nil
  }

  private func setVisibility(_ visible: Bool) -> Bool {
    if !canChangeVisibility(to: visible) {
      return false
    }
    if visible {
      guard let bridge = delegate?.appBridge?(forDevMenuManager: self) as? RCTBridge else {
        debugPrint("DevMenuManager: The delegate is unset or it didn't provide a bridge to render for.")
        return false
      }
      session = DevMenuSession(bridge: bridge, appInfo: delegate?.appInfo?(forDevMenuManager: self))
      DispatchQueue.main.async { self.window?.makeKeyAndVisible() }
    } else {
      session = nil
      DispatchQueue.main.async { self.window?.isHidden = true }
    }
    return true
  }
}
