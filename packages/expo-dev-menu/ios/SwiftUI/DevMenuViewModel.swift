// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Combine
import React
import ExpoModulesCore

@MainActor
class DevMenuViewModel: ObservableObject {
  @Published var appInfo: AppInfo?
  @Published var devSettings: DevSettings?
  @Published var registeredCallbacks: [String] = []
  @Published var availableAppKeys: [String] = []
  @Published var currentAppKey: String?
  @Published var clipboardMessage: String?
  @Published var hostUrlCopiedMessage: String?
  @Published var isOnboardingFinished: Bool = true
  @Published var showFloatingActionButton: Bool = false

  private let devMenuManager = DevMenuManager.shared
  private var cancellables = Set<AnyCancellable>()

  init() {
    loadData()
    checkOnboardingStatus()
    observeRegisteredCallbacks()
    observeAvailableAppKeys()
    observeManifestChanges()
    observeMenuWillShow()
  }

  private func loadData() {
    loadAppInfo()
    loadDevSettings()
    loadRegisteredCallbacks()
    loadAvailableAppKeys()
    loadFloatingActionButtonState()
    refreshCurrentAppKey()
  }

  private func loadAvailableAppKeys() {
    self.availableAppKeys = devMenuManager.availableAppKeys
  }

  /// Reads the moduleName of the currently mounted root view. Called each time
  /// the menu is about to show, because the mounted component can change between
  /// opens (either via this section or via a reload).
  func refreshCurrentAppKey() {
    self.currentAppKey = DevMenuComponentSwitcher.shared.currentModuleName()
  }

  func switchToComponent(_ name: String) {
    devMenuManager.switchToComponent(name)
    devMenuManager.closeMenu()
  }

  func refresh() {
    loadData()
  }

  private func loadAppInfo() {
    let appInfoDict = devMenuManager.getAppInfo()

    self.appInfo = AppInfo(
      appName: appInfoDict["appName"] as? String ?? "Unknown",
      appVersion: appInfoDict["appVersion"] as? String ?? "Unknown",
      runtimeVersion: appInfoDict["runtimeVersion"] as? String,
      sdkVersion: appInfoDict["sdkVersion"] as? String,
      hostUrl: appInfoDict["hostUrl"] as? String,
      appIcon: appInfoDict["appIcon"] as? String,
      engine: appInfoDict["engine"] as? String
    )
  }

  private func loadDevSettings() {
    let devSettingsDict = devMenuManager.getDevSettings()

    self.devSettings = DevSettings(
      isElementInspectorAvailable: devSettingsDict["isElementInspectorAvailable"] as? Bool ?? false,
      isHotLoadingAvailable: devSettingsDict["isHotLoadingAvailable"] as? Bool ?? false,
      isPerfMonitorAvailable: devSettingsDict["isPerfMonitorAvailable"] as? Bool ?? false,
      isJSInspectorAvailable: devSettingsDict["isJSInspectorAvailable"] as? Bool ?? false,
      isHotLoadingEnabled: devSettingsDict["isHotLoadingEnabled"] as? Bool ?? false
    )
  }

  private func loadRegisteredCallbacks() {
    self.registeredCallbacks = devMenuManager.registeredCallbacks.map { $0.name }
  }

  func hideMenu() {
    devMenuManager.hideMenu()
  }

  func reload() {
    devMenuManager.reload()
    devMenuManager.closeMenu()
  }

  func goHome() {
    guard devMenuManager.canNavigateHome else {
      return
    }

    devMenuManager.closeMenu()
    devMenuManager.navigateHome()
  }

  func togglePerformanceMonitor() {
    devMenuManager.togglePerformanceMonitor()
    devMenuManager.closeMenu()
  }

  func toggleElementInspector() {
    devMenuManager.toggleInspector()
    devMenuManager.closeMenu()
  }

  func openJSInspector() {
    devMenuManager.openJSInspector()
    devMenuManager.closeMenu()
  }

  func toggleFastRefresh() {
    devMenuManager.toggleFastRefresh()
    loadDevSettings()
  }

  func openRNDevMenu() {
    guard let rctDevMenu: RCTDevMenu = devMenuManager.currentAppContext?.nativeModule(named: "RCTDevMenu") else {
      return
    }

    devMenuManager.closeMenu {
// TODO(gabrieldonadel): Remove this once we bump react-native-macos to 0.84
#if !os(macOS)
      rctDevMenu.devMenuEnabled = true
      rctDevMenu.show()
      rctDevMenu.devMenuEnabled = false
#else
      // react-native-macos's RCTDevMenu has no devMenuEnabled property, so show it directly.
      rctDevMenu.show()
#endif
    }
  }

  func copyToClipboard(_ content: String) {
    #if !os(tvOS) && !os(macOS)
    UIPasteboard.general.string = content
    hostUrlCopiedMessage = "Copied to clipboard"

    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
      self.hostUrlCopiedMessage = nil
    }
    #endif
  }

  func copyAppInfo() {
    #if !os(tvOS) && !os(macOS)
    guard let appInfo = appInfo else {
      return
    }

    var info: [String: String] = [
      "appName": appInfo.appName,
      "appVersion": appInfo.appVersion
    ]

    if let runtimeVersion = appInfo.runtimeVersion {
      info["runtimeVersion"] = runtimeVersion
    }

    if let sdkVersion = appInfo.sdkVersion {
      info["sdkVersion"] = sdkVersion
    }

    let jsonData = try? JSONSerialization.data(withJSONObject: info, options: .prettyPrinted)
    let jsonString = jsonData.flatMap { String(data: $0, encoding: .utf8) } ?? "Unable to serialize app info"

    UIPasteboard.general.string = jsonString
    clipboardMessage = "Copied to clipboard"

    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
      self.clipboardMessage = nil
    }
    #endif
  }

  func fireCallback(_ name: String) {
    guard let callback = devMenuManager.registeredCallbacks.first(where: { $0.name == name }) else {
      return
    }

    devMenuManager.sendEventToDelegateBridge("registeredCallbackFired", data: name)
    if callback.shouldCollapse {
      devMenuManager.closeMenu()
    }
  }

  var canNavigateHome: Bool {
    return devMenuManager.canNavigateHome
  }

  var shouldShowReactNativeDevMenu: Bool {
    return devMenuManager.shouldShowReactNativeDevMenu
  }

  var configuration: DevMenuConfiguration {
    return devMenuManager.configuration
  }

  private func checkOnboardingStatus() {
    isOnboardingFinished = devMenuManager.isOnboardingFinished
  }

  func finishOnboarding() {
    devMenuManager.setOnboardingFinished(true)
    isOnboardingFinished = true
  }

  private func loadFloatingActionButtonState() {
    showFloatingActionButton = DevMenuPreferences.showFloatingActionButton
  }

  func toggleFloatingActionButton() {
    showFloatingActionButton.toggle()
    DevMenuPreferences.showFloatingActionButton = showFloatingActionButton
  }

  private func observeRegisteredCallbacks() {
    devMenuManager.callbacksPublisher
      .map { $0.map { $0.name } }
      .receive(on: DispatchQueue.main)
      .assign(to: &$registeredCallbacks)
  }

  private func observeAvailableAppKeys() {
    devMenuManager.availableAppKeysPublisher
      .receive(on: DispatchQueue.main)
      .assign(to: &$availableAppKeys)
  }

  private func observeMenuWillShow() {
    devMenuManager.menuWillShowPublisher
      .receive(on: DispatchQueue.main)
      .sink { [weak self] _ in
        self?.refreshCurrentAppKey()
      }
      .store(in: &cancellables)
  }

  private func observeManifestChanges() {
    devMenuManager.manifestPublisher
      .receive(on: DispatchQueue.main)
      .sink { [weak self] _ in
        self?.loadAppInfo()
        self?.loadDevSettings()
      }
      .store(in: &cancellables)
  }
}
