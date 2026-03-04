// Copyright 2015-present 650 Industries. All rights reserved.

import React
import ExpoModulesCore
import EXManifests
import Combine

@objc
@MainActor
public class DevMenuManager: NSObject {
  @objc static let shared = DevMenuManager()

  private let menuWillShowSubject = PassthroughSubject<Void, Never>()
  var menuWillShowPublisher: AnyPublisher<Void, Never> {
    menuWillShowSubject.eraseToAnyPublisher()
  }

  private let manifestSubject = PassthroughSubject<Void, Never>()
  var manifestPublisher: AnyPublisher<Void, Never> {
    manifestSubject.eraseToAnyPublisher()
  }

  var window: DevMenuWindow?
  var fabWindow: DevMenuFABWindow?
  private var isNavigatingHome = false

  override init() {
    super.init()
    self.window = DevMenuWindow(manager: self)
    DevMenuPreferences.setup()
    readAutoLaunchDisabledState()
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  var currentManifest: Manifest? {
    return EXKernel.sharedInstance().visibleApp.appLoader.manifest
  }

  var currentManifestURL: URL? {
    return EXKernel.sharedInstance().visibleApp.appLoader.manifestUrl
  }

  var currentBridge: RCTBridge? {
    return RCTBridge.current()
  }

  var isCurrentAppSnack: Bool {
    guard let url = currentManifestURL?.absoluteString else { return false }
    return url.contains("snack")
  }

  @objc var isVisible: Bool {
    return !(window?.isHidden ?? true)
  }

  @objc
  @discardableResult
  func openMenu(_ screen: String? = nil) -> Bool {
    return setVisibility(true)
  }

  @objc
  @discardableResult
  func closeMenu(completion: (() -> Void)? = nil) -> Bool {
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

  @objc
  @discardableResult
  func hideMenu() -> Bool {
    return setVisibility(false)
  }

  @objc
  @discardableResult
  func toggleMenu() -> Bool {
    return isVisible ? closeMenu() : openMenu()
  }

  private func setVisibility(_ visible: Bool) -> Bool {
    if isVisible == visible { return false }
    if visible && currentBridge == nil { return false }

    if visible {
      menuWillShowSubject.send()
      DispatchQueue.main.async {
        self.updateFABVisibility()

        if self.window?.windowScene == nil {
          let windowScene = UIApplication.shared.connectedScenes
            .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
          self.window?.windowScene = windowScene
        }
        self.window?.makeKeyAndVisible()
      }
    } else {
      DispatchQueue.main.async {
        self.window?.closeBottomSheet(nil)
      }
    }
    return true
  }

  func reload() {
    hideMenu()

    guard let bridge = currentBridge else { return }
    let emc = bridge.module(forName: "ExpoModulesCore") as? ExpoBridgeModule
    emc?.appContext?.reloadAppAsync()
  }

  @objc func goHome() {
    isNavigatingHome = true
    fabWindow?.setVisible(false, animated: false)
    EXKernel.sharedInstance().switchTasks()
  }

  func togglePerformanceMonitor() {
    EXKernel.sharedInstance().visibleApp.appManager.togglePerformanceMonitor()
  }

  func toggleElementInspector() {
    EXKernel.sharedInstance().visibleApp.appManager.toggleElementInspector()
  }

  func openJSInspector() {
    guard let bridge = currentBridge, let bundleURL = bridge.bundleURL else {
      return
    }
    let port = bundleURL.port ?? Int(RCT_METRO_PORT)
    let host = bundleURL.host ?? "localhost"
    let openURL = "http://\(host):\(port)/_expo/debugger?applicationId=\(Bundle.main.bundleIdentifier ?? "")"
    guard let url = URL(string: openURL) else { return }
    let request = NSMutableURLRequest(url: url)
    request.httpMethod = "PUT"
    URLSession.shared.dataTask(with: request as URLRequest).resume()
  }

  func toggleFastRefresh() {
    guard let bridge = currentBridge,
          let devSettings = bridge.module(forName: "DevSettings") as? RCTDevSettings else {
      return
    }
    devSettings.isHotLoadingEnabled = !devSettings.isHotLoadingEnabled
  }

  func getAppInfo() -> AppInfo {
    let manifest = currentManifest
    let manifestURL = currentManifestURL

    let appName = manifest?.name() ?? bundleDisplayName()
    let appVersion = manifest?.version() ?? formattedAppVersion()
    let runtimeVersion: String? = nil // only available on ExpoUpdatesManifest
    let sdkVersion = manifest?.expoGoSDKVersion()
    let hostUrl = manifestURL?.absoluteString
    let appIcon = manifest?.iosAppIconUrl() ?? bundleAppIcon()
    let engine = resolveEngine()

    return AppInfo(
      appName: appName,
      appVersion: appVersion,
      runtimeVersion: runtimeVersion,
      sdkVersion: sdkVersion,
      hostUrl: hostUrl,
      appIcon: appIcon,
      engine: engine
    )
  }

  func getDevSettings() -> DevSettings {
    guard let bridge = currentBridge,
          let bridgeSettings = bridge.module(forName: "DevSettings") as? RCTDevSettings else {
      return DevSettings(
        isElementInspectorAvailable: false,
        isHotLoadingAvailable: false,
        isPerfMonitorAvailable: false,
        isJSInspectorAvailable: false,
        isHotLoadingEnabled: false
      )
    }

    let perfMonitor = bridge.module(forName: "PerfMonitor")
    let isDev = currentManifest?.isDevelopmentMode() == true
    let isPerfMonitorAvailable = perfMonitor != nil && isDev

    return DevSettings(
      isElementInspectorAvailable: isDev,
      isHotLoadingAvailable: bridgeSettings.isHotLoadingAvailable,
      isPerfMonitorAvailable: isPerfMonitorAvailable,
      isJSInspectorAvailable: bridgeSettings.isDeviceDebuggingAvailable,
      isHotLoadingEnabled: bridgeSettings.isHotLoadingEnabled
    )
  }

  func updateFABVisibility() {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }

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

  func setupFABWindowIfNeeded(for windowScene: UIWindowScene) {
    guard fabWindow == nil else { return }
    fabWindow = DevMenuFABWindow(manager: self, windowScene: windowScene)
  }

  @objc func attachGestureRecognizerToWindow(_ window: UIWindow) {
    let gestureRecognizer = DevMenuGestureRecognizer()
    gestureRecognizer.addTarget(self, action: #selector(handleThreeFingerLongPress(_:)))
    window.addGestureRecognizer(gestureRecognizer)
  }

  @objc func handleThreeFingerLongPress(_ recognizer: UIGestureRecognizer) {
    if recognizer.state == .began {
      toggleMenu()
    }
  }

  private var canLaunchDevMenuOnStart = true

  func shouldAutoLaunch() -> Bool {
    return canLaunchDevMenuOnStart
      && currentBridge != nil
      && (DevMenuPreferences.showsAtLaunch || shouldShowOnboarding())
  }

  @objc func autoLaunch() {
    NotificationCenter.default.removeObserver(self)
    DispatchQueue.main.async {
      self.openMenu()
    }
  }

  func shouldShowOnboarding() -> Bool {
    return !isOnboardingFinished
  }

  private func readAutoLaunchDisabledState() {
    let userDefaultsValue = UserDefaults.standard.bool(forKey: "EXDevMenuDisableAutoLaunch")
    if userDefaultsValue {
      canLaunchDevMenuOnStart = false
      UserDefaults.standard.removeObject(forKey: "EXDevMenuDisableAutoLaunch")
    } else {
      canLaunchDevMenuOnStart = true
    }
  }

  @objc var isOnboardingFinished: Bool {
    return DevMenuPreferences.isOnboardingFinished
  }

  @objc func setOnboardingFinished(_ finished: Bool) {
    DevMenuPreferences.isOnboardingFinished = finished
  }

  @objc func getMotionGestureEnabled() -> Bool {
    return DevMenuPreferences.motionGestureEnabled
  }

  @objc func setMotionGestureEnabled(_ enabled: Bool) {
    DevMenuPreferences.motionGestureEnabled = enabled
  }

  @objc func getTouchGestureEnabled() -> Bool {
    return DevMenuPreferences.touchGestureEnabled
  }

  @objc func setTouchGestureEnabled(_ enabled: Bool) {
    DevMenuPreferences.touchGestureEnabled = enabled
  }

  @objc func notifyManifestChanged() {
    manifestSubject.send()
  }

  private func bundleDisplayName() -> String {
    return Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String
      ?? Bundle.main.object(forInfoDictionaryKey: "CFBundleExecutable") as? String
      ?? "Expo Go"
  }

  private func formattedAppVersion() -> String {
    let shortVersion = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? ""
    let buildVersion = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? ""
    return "\(shortVersion) (\(buildVersion))"
  }

  private func bundleAppIcon() -> String {
    guard let iconFiles = (Bundle.main.infoDictionary?["CFBundleIcons"] as? [String: Any])?["CFBundlePrimaryIcon"] as? [String: Any],
          let iconName = (iconFiles["CFBundleIconFiles"] as? [String])?.last else {
      return ""
    }
    let resourcePath = Bundle.main.resourcePath ?? ""
    return "file://" + resourcePath + "/" + iconName + ".png"
  }

  private func resolveEngine() -> String {
    #if USE_HERMES
    return "Hermes"
    #else
    return "JSC"
    #endif
  }
}
