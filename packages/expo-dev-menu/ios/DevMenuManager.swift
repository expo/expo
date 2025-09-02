// Copyright 2015-present 650 Industries. All rights reserved.

import React
import EXDevMenuInterface
import EXManifests
import CoreGraphics
import CoreMedia
import Combine

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
      updateAutoLaunchObserver()

      if let currentBridge {
        disableRNDevMenuHoykeys(for: currentBridge)
      }
    }
  }

  @objc
  public var currentManifest: Manifest?

  @objc
  public var currentManifestURL: URL?

  @objc
  public func autoLaunch(_ shouldRemoveObserver: Bool = true) {
    // swiftlint:disable notification_center_detachment
    NotificationCenter.default.removeObserver(self)
    // swiftlint:enable notification_center_detachment

    DispatchQueue.main.async {
      self.openMenu()
    }
  }

  func updateAutoLaunchObserver() {
    // swiftlint:disable notification_center_detachment
    NotificationCenter.default.removeObserver(self)
    // swiftlint:enable notification_center_detachment

    // swiftlint:disable legacy_objc_type
    if canLaunchDevMenuOnStart && currentBridge != nil && (DevMenuPreferences.showsAtLaunch || shouldShowOnboarding()) {
      NotificationCenter.default.addObserver(self, selector: #selector(DevMenuManager.autoLaunch), name: NSNotification.Name.RCTContentDidAppear, object: nil)
    }
    // swiftlint:enable legacy_objc_type
  }

  private func disableRNDevMenuHoykeys(for bridge: RCTBridge) {
    if let devMenu = bridge.devMenu {
      devMenu.hotkeysEnabled = false

      DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
        if DevMenuPreferences.keyCommandsEnabled {
          DevMenuKeyCommandsInterceptor.isInstalled = false
          DevMenuKeyCommandsInterceptor.isInstalled = true
        }
      }
    } else {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
        self.disableRNDevMenuHoykeys(for: bridge)
      }
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

  deinit {
    NotificationCenter.default.removeObserver(self)
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
        window?.closeBottomSheet(completion)
      } else {
        DispatchQueue.main.async { [self] in
          window?.closeBottomSheet(completion)
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

    let eventDispatcher = bridge.moduleRegistry.module(forName: "EventDispatcher") as? RCTEventDispatcher
    eventDispatcher?.sendDeviceEvent(withName: eventName, body: data)
  }

  /**
   Returns a bool value whether the dev menu can change its visibility.
   Returning `false` entirely disables the dev menu.
   */
  func canChangeVisibility(to visible: Bool) -> Bool {
    if isVisible == visible {
      return false
    }

    // Don't allow dev menu to open when there's no active React Native bridge
    // This prevents the menu from appearing when the dev-launcher UI is visible
    if visible && currentBridge == nil {
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

  private func setVisibility(_ visible: Bool, screen: String? = nil) -> Bool {
    if !canChangeVisibility(to: visible) {
      return false
    }
    if visible {
      setCurrentScreen(screen)
      DispatchQueue.main.async { self.window?.makeKeyAndVisible() }
    } else {
      DispatchQueue.main.async { self.window?.closeBottomSheet(nil) }
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

  // captures any callbacks that are registered via the `registerDevMenuItems` module method
  // it is set and unset by the public facing `DevMenuModule`
  // when the DevMenuModule instance is unloaded (e.g between app loads) the callback list is reset to an empty array
  private let callbacksSubject = PassthroughSubject<[Callback], Never>()
  public var callbacksPublisher: AnyPublisher<[Callback], Never> {
    callbacksSubject.eraseToAnyPublisher()
  }

  public var registeredCallbacks: [Callback] = [] {
    didSet {
      callbacksSubject.send(registeredCallbacks)
    }
  }

  func getDevToolsDelegate() -> DevMenuDevOptionsDelegate? {
    guard let currentBridge else {
      return nil
    }

    let devDelegate = DevMenuDevOptionsDelegate(forBridge: currentBridge)
    guard devDelegate.devSettings != nil else {
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
