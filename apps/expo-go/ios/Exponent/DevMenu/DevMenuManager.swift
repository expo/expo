// Copyright 2015-present 650 Industries. All rights reserved.

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
    
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleContentDidAppear),
      name: Notification.Name("RCTContentDidAppearNotification"),
      object: nil
    )
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

  var currentBundleURL: URL? {
    guard let manifest = currentManifest else { return nil }
    return ApiUtil.bundleUrlFromManifest(manifest)
  }

  var hasActiveApp: Bool {
    return EXKernel.sharedInstance().visibleApp.appManager.reactHost != nil
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
  func openMenu() -> Bool {
    return setVisibility(true)
  }

  @objc
  @discardableResult
  func closeMenu(completion: (() -> Void)? = nil) -> Bool {
    if isVisible {
      window?.closeBottomSheet(completion)
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
    if visible && !hasActiveApp { return false }

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
    EXKernel.sharedInstance().reloadVisibleApp()
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
    guard let manifestURL = currentManifestURL else {
      return
    }
    let port = manifestURL.port ?? 8081
    let host = manifestURL.host ?? "localhost"
    let openURL = "http://\(host):\(port)/_expo/debugger?applicationId=\(Bundle.main.bundleIdentifier ?? "")"
    guard let url = URL(string: openURL) else { return }
    let request = NSMutableURLRequest(url: url)
    request.httpMethod = "PUT"
    URLSession.shared.dataTask(with: request as URLRequest).resume()
  }

  func toggleFastRefresh() {
    EXKernel.sharedInstance().visibleApp.appManager.selectDevMenuItem(withKey: "dev-hmr")
  }

  func getAppInfo() -> AppInfo {
    let manifest = currentManifest
    let manifestURL = currentManifestURL

    let appName = manifest?.name() ?? bundleDisplayName()
    let appVersion = manifest?.version() ?? formattedAppVersion()
    let runtimeVersion: String? = nil
    let sdkVersion = manifest?.expoGoSDKVersion()
    let hostUrl = manifestURL?.absoluteString
    let appIcon = manifest?.iosAppIconUrl() ?? bundleAppIcon()
    let engine = "Hermes"

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
    let appManager = EXKernel.sharedInstance().visibleApp.appManager
    let isDev = appManager.enablesDeveloperTools()

    return DevSettings(
      isElementInspectorAvailable: isDev,
      isHotLoadingAvailable: appManager.isHotLoadingAvailable(),
      isPerfMonitorAvailable: appManager.isPerfMonitorAvailable(),
      isJSInspectorAvailable: isDev,
      isHotLoadingEnabled: appManager.isHotLoadingEnabled()
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
        && self.hasActiveApp
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
    if recognizer.state == .began, DevMenuPreferences.touchGestureEnabled {
      if toggleMenu() {
        let feedback = UIImpactFeedbackGenerator(style: .light)
        feedback.prepare()
        feedback.impactOccurred()
      }

      recognizer.isEnabled = false
      recognizer.isEnabled = true
    }
  }

  func shouldShowOnboarding() -> Bool {
    return !isOnboardingFinished
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
    isNavigatingHome = false
    manifestSubject.send()
  }

  @objc private func handleContentDidAppear() {
    NotificationCenter.default.removeObserver(
      self,
      name: Notification.Name("RCTContentDidAppearNotification"),
      object: nil
    )

    if shouldShowOnboarding() || DevMenuPreferences.showsAtLaunch {
      openMenu()
    } else {
      updateFABVisibility()
    }
  }

  private func bundleDisplayName() -> String {
    return "Expo Go"
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
}
