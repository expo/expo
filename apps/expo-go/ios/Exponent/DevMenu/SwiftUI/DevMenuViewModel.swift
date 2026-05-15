// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Combine

@MainActor
class DevMenuViewModel: ObservableObject {
  @Published var appInfo: AppInfo?
  @Published var devSettings: DevSettings?
  @Published var clipboardMessage: String?
  @Published var hostUrlCopiedMessage: String?
  @Published var isOnboardingFinished: Bool = true
  @Published var showFloatingActionButton: Bool = false
  @Published var showDebuggingTip: Bool = false
  @Published var showFastRefresh: Bool = false
  @Published var showHostUrl: Bool = false

  private let manager: DevMenuManager
  private var cancellables = Set<AnyCancellable>()

  var canNavigateHome: Bool {
    return true
  }

  init(manager: DevMenuManager) {
    self.manager = manager
    loadData()
    checkOnboardingStatus()
    observeManifestChanges()
  }

  private func loadData() {
    loadAppInfo()
    loadDevSettings()
    loadFloatingActionButtonState()
    updateSectionVisibility()
  }

  private func loadAppInfo() {
    self.appInfo = manager.getAppInfo()
  }

  private func loadDevSettings() {
    self.devSettings = manager.getDevSettings()
  }

  private func updateSectionVisibility() {
    let manifest = manager.currentManifest
    let isDev = manifest?.isDevelopmentMode() == true || manifest?.isUsingDeveloperTool() == true
    showDebuggingTip = isDev
    showFastRefresh = isDev
    showHostUrl = !isDev && manager.isCurrentAppSnack
  }

  func hideMenu() {
    manager.hideMenu()
  }

  func reload() {
    manager.reload()
  }

  func goHome() {
    manager.closeMenu()
    manager.goHome()
  }

  func togglePerformanceMonitor() {
    manager.togglePerformanceMonitor()
    manager.closeMenu()
  }

  func toggleElementInspector() {
    manager.toggleElementInspector()
    manager.closeMenu()
  }

  func openJSInspector() {
    manager.openJSInspector()
    manager.closeMenu()
  }

  func toggleFastRefresh() {
    manager.toggleFastRefresh()
    loadDevSettings()
  }

  func copyToClipboard(_ content: String) {
    UIPasteboard.general.string = content
    hostUrlCopiedMessage = "Copied!"

    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
      self.hostUrlCopiedMessage = nil
    }
  }

  func copyAppInfo() {
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
  }

  func finishOnboarding() {
    manager.setOnboardingFinished(true)
    isOnboardingFinished = true
  }

  private func checkOnboardingStatus() {
    isOnboardingFinished = manager.isOnboardingFinished
  }

  private func loadFloatingActionButtonState() {
    showFloatingActionButton = DevMenuPreferences.showFloatingActionButton
  }

  func toggleFloatingActionButton() {
    showFloatingActionButton.toggle()
    DevMenuPreferences.showFloatingActionButton = showFloatingActionButton
  }

  private func observeManifestChanges() {
    manager.manifestPublisher
      .receive(on: DispatchQueue.main)
      .sink { [weak self] _ in
        self?.loadAppInfo()
        self?.loadDevSettings()
        self?.updateSectionVisibility()
      }
      .store(in: &cancellables)
  }
}
