// Copyright 2015-present 650 Industries. All rights reserved.

import React
import EXDevMenuInterface
import EXManifests
import CoreGraphics
import CoreMedia

class Dispatch {
  static func mainSync<T>(_ closure: () -> T) -> T {
    if Thread.isMainThread {
      return closure()
    }
  var result: T?
  DispatchQueue.main.sync {
    result = closure()
  }
  // swiftlint:disable:next force_unwrapping
  return result!
  }
}

/**
 A container for array.
 NSMapTable requires the second generic type to be a class, so `[DevMenuScreen]` is not allowed.
 */
class DevMenuCacheContainer<T> {
  fileprivate let items: [T]

  fileprivate init(items: [T]) {
    self.items = items
  }
}

/**
 Manages the dev menu and provides most of the public API.
 */
@objc
open class DevMenuManager: NSObject {
  public class Callback {
    let name: String
    let shouldCollapse: Bool

    init(name: String, shouldCollapse: Bool) {
      self.name = name
      self.shouldCollapse = shouldCollapse
    }
  }

  var packagerConnectionHandler: DevMenuPackagerConnectionHandler?
  var canLaunchDevMenuOnStart = true

  static public var wasInitilized = false

  /**
   Shared singleton instance.
   */
  @objc
  static public let shared: DevMenuManager = {
    wasInitilized = true
    return DevMenuManager()
  }()

  /**
   The window that controls and displays the dev menu view.
   */
  var window: DevMenuWindow?

  /**
   `DevMenuAppInstance` instance that is responsible for initializing and managing React Native context for the dev menu.
   */
  lazy var appInstance: DevMenuAppInstance = DevMenuAppInstance(manager: self)

  var currentScreen: String?

  /**
   For backwards compatibility in projects that call this method from AppDelegate
   */
  @available(*, deprecated, message: "Manual setup of DevMenuManager in AppDelegate is deprecated in favor of automatic setup with Expo Modules")
  @objc
  public static func configure(withBridge bridge: AnyObject) { }

  @objc
  public var currentBridge: RCTBridge? {
    didSet {
      guard self.canLaunchDevMenuOnStart && (DevMenuPreferences.showsAtLaunch || self.shouldShowOnboarding()), let bridge = currentBridge else {
        return
      }

      // When using the proxy bridge isLoading is always false, so always add the ContentDidAppearNotification observer
      if bridge.isLoading || bridge.isProxy() {
        NotificationCenter.default.addObserver(self, selector: #selector(DevMenuManager.autoLaunch), name: DevMenuViewController.ContentDidAppearNotification, object: nil)
      } else {
        autoLaunch()
      }
    }
  }
  @objc
  public var currentManifest: Manifest?

  @objc
  public var currentManifestURL: URL?

  @objc
  public func autoLaunch(_ shouldRemoveObserver: Bool = true) {
    NotificationCenter.default.removeObserver(self)

    DispatchQueue.main.async {
      self.openMenu()
    }
  }

  override init() {
    super.init()
    self.window = DevMenuWindow(manager: self)
    self.packagerConnectionHandler = DevMenuPackagerConnectionHandler(manager: self)
    self.packagerConnectionHandler?.setup()
    DevMenuPreferences.setup()
    self.readAutoLaunchDisabledState()
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
  public func openMenu(_ screen: String? = nil) -> Bool {
    return setVisibility(true, screen: screen)
  }

  @objc
  @discardableResult
  public func openMenu() -> Bool {
    appInstance.sendOpenEvent()
    return openMenu(nil)
  }

  /**
   Sends an event to JS to start collapsing the dev menu bottom sheet.
   */
  @objc
  @discardableResult
  public func closeMenu(completion: (() -> Void)? = nil) -> Bool {
    if isVisible {
      if Thread.isMainThread {
        window?.closeBottomSheet(completion: completion)
      } else {
        DispatchQueue.main.async { [self] in
          window?.closeBottomSheet(completion: completion)
        }
      }
      return true
    }

    return false
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

  @objc
  public func setCurrentScreen(_ screenName: String?) {
    currentScreen = screenName
  }

  @objc
  public func sendEventToDelegateBridge(_ eventName: String, data: Any?) {
    guard let bridge = currentBridge else {
      return
    }

    let args = data == nil ? [eventName] : [eventName, data!]
    bridge.enqueueJSCall("RCTDeviceEventEmitter.emit", args: args)
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

    return true
  }

  /**
   Returns bool value whether the onboarding view should be displayed by the dev menu view.
   */
  func shouldShowOnboarding() -> Bool {
    return !DevMenuPreferences.isOnboardingFinished
  }

  func readAutoLaunchDisabledState() {
    let userDefaultsValue = UserDefaults.standard.bool(forKey: "EXDevMenuDisableAutoLaunch")
    if userDefaultsValue {
      self.canLaunchDevMenuOnStart = false
      UserDefaults.standard.removeObject(forKey: "EXDevMenuDisableAutoLaunch")
    } else {
      self.canLaunchDevMenuOnStart = true
    }
  }

  var userInterfaceStyle: UIUserInterfaceStyle {
    return UIUserInterfaceStyle.unspecified
  }

  // MARK: private

  private func setVisibility(_ visible: Bool, screen: String? = nil) -> Bool {
    if !canChangeVisibility(to: visible) {
      return false
    }
    if visible {
      guard currentBridge != nil else {
        debugPrint("DevMenuManager: There is no bridge to render DevMenu.")
        return false
      }
      setCurrentScreen(screen)
      DispatchQueue.main.async { self.window?.makeKeyAndVisible() }
    } else {
      DispatchQueue.main.async { self.window?.isHidden = true }
    }
    return true
  }

  @objc
  public func getAppInfo() -> [AnyHashable: Any] {
    return EXDevMenuAppInfo.getAppInfo()
  }

  @objc
  public func getDevSettings() -> [AnyHashable: Any] {
    return EXDevMenuDevSettings.getDevSettings()
  }

  private static var fontsWereLoaded = false

  @objc
  public func loadFonts() {
    if DevMenuManager.fontsWereLoaded {
       return
    }
    DevMenuManager.fontsWereLoaded = true

    let fonts = [
      "Inter-Black",
      "Inter-ExtraBold",
      "Inter-Bold",
      "Inter-SemiBold",
      "Inter-Medium",
      "Inter-Regular",
      "Inter-Light",
      "Inter-ExtraLight",
      "Inter-Thin"
    ]

    for font in fonts {
      let path = DevMenuUtils.resourcesBundle()?.path(forResource: font, ofType: "otf")
      let data = FileManager.default.contents(atPath: path!)
      let provider = CGDataProvider(data: data! as CFData)
      let font = CGFont(provider!)
      var error: Unmanaged<CFError>?
      CTFontManagerRegisterGraphicsFont(font!, &error)
    }
  }

  // captures any callbacks that are registered via the `registerDevMenuItems` module method
  // it is set and unset by the public facing `DevMenuModule`
  // when the DevMenuModule instance is unloaded (e.g between app loads) the callback list is reset to an empty array
  public var registeredCallbacks: [Callback] = []

  func getDevToolsDelegate() -> DevMenuDevOptionsDelegate? {
    guard let bridge = currentBridge else {
      return nil
    }

    let devDelegate = DevMenuDevOptionsDelegate(forBridge: bridge)
    guard let devSettings = devDelegate.devSettings else {
      return nil
    }

    return devDelegate
  }

  func reload() {
    let devToolsDelegate = getDevToolsDelegate()
    devToolsDelegate?.reload()
  }

  func togglePerformanceMonitor() {
    let devToolsDelegate = getDevToolsDelegate()
    devToolsDelegate?.togglePerformanceMonitor()
  }

  func toggleInspector() {
    let devToolsDelegate = getDevToolsDelegate()
    devToolsDelegate?.toggleElementInsector()
  }

  func openJSInspector() {
    let devToolsDelegate = getDevToolsDelegate()
    devToolsDelegate?.openJSInspector()
  }

  func toggleFastRefresh() {
    let devToolsDelegate = getDevToolsDelegate()
    devToolsDelegate?.toggleFastRefresh()
  }
}
