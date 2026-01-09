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

  weak var hostDelegate: DevMenuHostDelegate?

  @objc
  public private(set) var currentBridge: RCTBridge? {
    didSet {
      updateAutoLaunchObserver()

      if let currentBridge {
        DispatchQueue.main.async {
          self.disableRNDevMenuHoykeys(for: currentBridge)
        }
      }
    }
  }

  private let manifestSubject = PassthroughSubject<Void, Never>()
  public var manifestPublisher: AnyPublisher<Void, Never> {
    manifestSubject.eraseToAnyPublisher()
  }

  @objc
  public private(set) var currentManifest: Manifest? {
    didSet {
      manifestSubject.send()
    }
  }

  @objc
  public private(set) var currentManifestURL: URL? {
    didSet {
      manifestSubject.send()
    }
  }

  @objc
  public func setDelegate(_ delegate: DevMenuHostDelegate?) {
    hostDelegate = delegate
  }

  @objc
  public func setMotionGestureEnabled(_ enabled: Bool) {
    DevMenuPreferences.motionGestureEnabled = enabled
  }

  @objc
  public func setTouchGestureEnabled(_ enabled: Bool) {
    DevMenuPreferences.touchGestureEnabled = enabled
  }

  @objc
  public func getMotionGestureEnabled() -> Bool {
    return DevMenuPreferences.motionGestureEnabled
  }

  @objc
  public func getTouchGestureEnabled() -> Bool {
    return DevMenuPreferences.touchGestureEnabled
  }

  @objc
  public func updateCurrentBridge(_ bridge: RCTBridge?) {
    currentBridge = bridge
  }

  @objc
  public func updateCurrentManifest(_ manifest: Manifest?, manifestURL: URL?) {
    currentManifest = manifest
    currentManifestURL = manifestURL
  }

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
#if !os(macOS)
    return Dispatch.mainSync { !(window?.isHidden ?? true) }
#else
    return window?.isVisible ?? false
#endif
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
  public var canNavigateHome: Bool {
    guard let delegate = hostDelegate else {
      return false
    }
    return delegate.responds(to: #selector(DevMenuHostDelegate.devMenuNavigateHome))
  }

  @objc
  public func navigateHome() {
    guard let delegate = hostDelegate,
      delegate.responds(to: #selector(DevMenuHostDelegate.devMenuNavigateHome)) else {
      return
    }

    let action: () -> Void = {
      delegate.devMenuNavigateHome?()
    }

    if Thread.isMainThread {
      action()
    } else {
      DispatchQueue.main.async(execute: action)
    }
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

    if let eventDispatcher = bridge.moduleRegistry.module(forName: "EventDispatcher") as? NSObject {
      let selector = NSSelectorFromString("sendDeviceEventWithName:body:")
      if eventDispatcher.responds(to: selector) {
        eventDispatcher.perform(selector, with: eventName, with: data)
      }
    }
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
    return !isOnboardingFinished
  }

  @objc
  public var isOnboardingFinished: Bool {
    return DevMenuPreferences.isOnboardingFinished
  }

  @objc
  public func setOnboardingFinished(_ finished: Bool) {
    DevMenuPreferences.isOnboardingFinished = finished
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

#if !os(macOS)
  var userInterfaceStyle: UIUserInterfaceStyle {
    return UIUserInterfaceStyle.unspecified
  }
#endif

  private func setVisibility(_ visible: Bool, screen: String? = nil) -> Bool {
    if !canChangeVisibility(to: visible) {
      return false
    }
    if visible {
      setCurrentScreen(screen)
      DispatchQueue.main.async {
#if os(macOS)
        self.window?.makeKeyAndOrderFront(nil)
#else
        if self.window?.windowScene == nil {
          let keyWindowScene = UIApplication.shared.windows.first(where: { $0.isKeyWindow })?.windowScene
          let windowScene = keyWindowScene ?? UIApplication.shared.connectedScenes
            .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
          self.window?.windowScene = windowScene
        }
        self.window?.makeKeyAndVisible()
#endif
      }
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
