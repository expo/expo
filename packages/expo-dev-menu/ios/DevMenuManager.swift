// Copyright 2015-present 650 Industries. All rights reserved.

import React
import EXDevMenuInterface
import EXManifests
import CoreGraphics
import CoreMedia
import Combine

/**
 Configuration options for customizing the dev menu appearance.
 Host apps (e.g., Expo Go) can set these to tailor the menu for their context.
 The defaults match the standard dev menu behavior.
 */
@objc
public class DevMenuConfiguration: NSObject {
  /// Whether to show the debugging tip (e.g., "Debugging not working? Try manually reloading first.")
  @objc public var showDebuggingTip: Bool = true

  /// Whether to show the "Connected to:" host URL section
  @objc public var showHostUrl: Bool = true

  /// Whether to show the Fast Refresh toggle
  @objc public var showFastRefresh: Bool = true

  /// Whether to show the Toggle Performance Monitor button
  @objc public var showPerformanceMonitor: Bool = true

  /// Whether to show the Toggle Element Inspector button
  @objc public var showElementInspector: Bool = true

  /// Whether to show the runtime/SDK version in the header and app info
  @objc public var showRuntimeVersion: Bool = true

  /// Whether to show the SYSTEM section (version, runtime version, copy system info)
  @objc public var showSystemSection: Bool = true

  /// Override the app name shown in the header. When set, this takes precedence over the manifest name.
  @objc public var appNameOverride: String?

  /// Custom title for the onboarding text. Use to replace "development builds" with e.g. "Expo Go".
  /// When nil, the default "development builds" text is used.
  @objc public var onboardingAppName: String?
}

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

  @objc public var configuration = DevMenuConfiguration()

  static public var wasInitilized = false

  private var contentDidAppearObserver: NSObjectProtocol?
  private var bridgeDetectionObserver: NSObjectProtocol?

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

  #if !os(macOS) && !os(tvOS)
  /**
   The window that hosts the floating action button.
   */
  var fabWindow: DevMenuFABWindow?
  #endif

  var currentScreen: String?

  private var isNavigatingHome = false

  /// Track if user tried to open menu before bridge was ready
  private var pendingMenuOpen = false

  weak var hostDelegate: DevMenuHostDelegate?

  @objc
  public private(set) var currentBridge: RCTBridge? {
    didSet {
      if currentBridge == nil {
        pendingMenuOpen = false
      }
      updateAutoLaunchObserver()

      if let currentBridge {
        DispatchQueue.main.async {
          self.disableRNDevMenuHoykeys(for: currentBridge)
        }
        observeContentDidAppear()
      } else {
        updateFABVisibility()
      }
    }
  }

  private func observeContentDidAppear() {
    if let observer = contentDidAppearObserver {
      NotificationCenter.default.removeObserver(observer)
    }

    contentDidAppearObserver = NotificationCenter.default.addObserver(
      forName: NSNotification.Name.RCTContentDidAppear,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      guard let self else { return }

      // RCTContentDidAppear is the most reliable signal that JS is executing
      // If bridge wasn't set explicitly by host app, try to get it now
      if self.currentBridge == nil {
        if let bridge = RCTBridge.current() {
          self.currentBridge = bridge
        }
      }

      // If user tried to open menu before bridge was ready, open it now
      if self.pendingMenuOpen {
        self.pendingMenuOpen = false
        self.openMenu()
      } else {
        self.updateFABVisibility()
      }

      if let observer = self.contentDidAppearObserver {
        NotificationCenter.default.removeObserver(observer)
        self.contentDidAppearObserver = nil
      }
    }
  }

  private let manifestSubject = PassthroughSubject<Void, Never>()
  public var manifestPublisher: AnyPublisher<Void, Never> {
    manifestSubject.eraseToAnyPublisher()
  }

  private let menuWillShowSubject = PassthroughSubject<Void, Never>()
  public var menuWillShowPublisher: AnyPublisher<Void, Never> {
    menuWillShowSubject.eraseToAnyPublisher()
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
  public func setShowFloatingActionButton(_ enabled: Bool) {
    DevMenuPreferences.showFloatingActionButton = enabled
  }

  @objc
  public func updateCurrentBridge(_ bridge: RCTBridge?) {
    currentBridge = bridge
    if bridge != nil {
      isNavigatingHome = false
    }
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
    self.setupBridgeDetectionObserver()
  }

  /// Persistent observer for RCTContentDidAppear to auto-detect bridge if not set explicitly.
  private func setupBridgeDetectionObserver() {
    bridgeDetectionObserver = NotificationCenter.default.addObserver(
      forName: NSNotification.Name.RCTContentDidAppear,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      guard let self else { return }

      // If bridge wasn't set explicitly, try to get it now
      if self.currentBridge == nil {
        if let bridge = RCTBridge.current() {
          self.currentBridge = bridge
        }
      }

      // Fulfill pending menu open if there was one
      if self.pendingMenuOpen && self.currentBridge != nil {
        self.pendingMenuOpen = false
        self.openMenu()
      }
    }
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
    if let observer = bridgeDetectionObserver {
      NotificationCenter.default.removeObserver(observer)
    }
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
  public var shouldShowReactNativeDevMenu: Bool {
    guard let delegate = hostDelegate,
      delegate.responds(to: #selector(DevMenuHostDelegate.devMenuShouldShowReactNativeDevMenu)) else {
      return true
    }
    return delegate.devMenuShouldShowReactNativeDevMenu?() ?? true
  }

  @objc
  public func navigateHome() {
    guard let delegate = hostDelegate,
      delegate.responds(to: #selector(DevMenuHostDelegate.devMenuNavigateHome)) else {
      return
    }

    isNavigatingHome = true
    pendingMenuOpen = false

    #if !os(macOS) && !os(tvOS)
    fabWindow?.setVisible(false, animated: false)
    #endif

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
      pendingMenuOpen = true
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
      menuWillShowSubject.send()
      setCurrentScreen(screen)
      DispatchQueue.main.async {
#if os(macOS)
        self.window?.makeKeyAndOrderFront(nil)
#elseif os(tvOS)
        self.window?.makeKeyAndVisible()
#else
        self.updateFABVisibility()

        if self.window?.windowScene == nil {
          let windowScene = UIApplication.shared.connectedScenes
            .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
          self.window?.windowScene = windowScene
        }
        self.window?.makeKeyAndVisible()
#endif
      }
    } else {
      DispatchQueue.main.async {
        self.window?.closeBottomSheet(nil)
      }
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
    SourceMapService.clearCache()

    #if !os(macOS) && !os(tvOS)
    fabWindow?.setVisible(false, animated: false)
    #endif

    if let delegate = hostDelegate,
       delegate.responds(to: #selector(DevMenuHostDelegate.devMenuReload)) {
      delegate.devMenuReload?()
      return
    }

    let devToolsDelegate = getDevToolsDelegate()
    devToolsDelegate?.reload()
  }

  func togglePerformanceMonitor() {
    if let delegate = hostDelegate,
       delegate.responds(to: #selector(DevMenuHostDelegate.devMenuTogglePerformanceMonitor)) {
      delegate.devMenuTogglePerformanceMonitor?()
      return
    }

    let devToolsDelegate = getDevToolsDelegate()
    devToolsDelegate?.togglePerformanceMonitor()
  }

  func toggleInspector() {
    if let delegate = hostDelegate,
       delegate.responds(to: #selector(DevMenuHostDelegate.devMenuToggleElementInspector)) {
      delegate.devMenuToggleElementInspector?()
      return
    }

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

  #if !os(macOS) && !os(tvOS)
  private func setupFABWindowIfNeeded(for windowScene: UIWindowScene) {
    guard fabWindow == nil else { return }
    fabWindow = DevMenuFABWindow(manager: self, windowScene: windowScene)
  }

  @objc public func hideFAB() {
    fabWindow?.setVisible(false, animated: false)
  }

  public func updateFABVisibility() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }

      if self.fabWindow == nil {
        if let windowScene = UIApplication.shared.connectedScenes
          .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
          self.setupFABWindowIfNeeded(for: windowScene)
        }
      }

      let shouldShow = DevMenuPreferences.showFloatingActionButton
        && !self.isVisible
        && self.currentBridge != nil
        && !self.isNavigatingHome
        && DevMenuPreferences.isOnboardingFinished
      self.fabWindow?.setVisible(shouldShow, animated: true)
    }
  }
  #else
  public func updateFABVisibility() {
    // FAB not available on macOS/tvOS
  }
  #endif
}
