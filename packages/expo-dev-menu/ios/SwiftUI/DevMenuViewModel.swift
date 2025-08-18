// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import UIKit
import Combine

@MainActor
class DevMenuViewModel: ObservableObject {
  @Published var appInfo: AppInfo?
  @Published var devSettings: DevSettings?
  @Published var registeredCallbacks: [String] = []
  @Published var clipboardMessage: String?
  @Published var hostUrlCopiedMessage: String?
  @Published var isOnboardingFinished: Bool = true

  private let devMenuManager = DevMenuManager.shared
  private var cancellables = Set<AnyCancellable>()

  init() {
    loadData()
    checkOnboardingStatus()
    observeRegisteredCallbacks()
  }

  private func loadData() {
    loadAppInfo()
    loadDevSettings()
    loadRegisteredCallbacks()
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
    devMenuManager.closeMenu()
    if let devLauncherClass = NSClassFromString("EXDevLauncherController") as? NSObject.Type {
      let sharedInstance = devLauncherClass.perform(Selector(("sharedInstance")))?.takeUnretainedValue()
      _ = sharedInstance?.perform(Selector(("navigateToLauncher")))
    }
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
    guard let rctDevMenu = devMenuManager.currentBridge?.devMenu else {
      return
    }

    devMenuManager.closeMenu {
      DevMenuPackagerConnectionHandler.allowRNDevMenuTemporarily()
      rctDevMenu.show()
    }
  }

  func copyToClipboard(_ content: String) {
    #if !os(tvOS)
    UIPasteboard.general.string = content
    hostUrlCopiedMessage = "Copied!"

    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
      self.hostUrlCopiedMessage = nil
    }
    #endif
  }

  func copyAppInfo() {
    #if !os(tvOS)
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
    clipboardMessage = "Copied to clipboard!"

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

  var isDevLauncherInstalled: Bool {
    return NSClassFromString("EXDevLauncherController") != nil
  }

  private func checkOnboardingStatus() {
    isOnboardingFinished = UserDefaults.standard.bool(forKey: "EXDevMenuIsOnboardingFinished")
  }

  func finishOnboarding() {
    UserDefaults.standard.set(true, forKey: "EXDevMenuIsOnboardingFinished")
    isOnboardingFinished = true
  }

  private func observeRegisteredCallbacks() {
    devMenuManager.callbacksPublisher
      .map { $0.map { $0.name } }
      .receive(on: DispatchQueue.main)
      .assign(to: &$registeredCallbacks)
  }
}
