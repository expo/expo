// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import UIKit
import EXDevMenu

@MainActor
class SettingsManager: ObservableObject {
  @Published var shakeToShowDevMenu = true
  @Published var threeFingerLongPressEnabled = true
  @Published var selectedTheme = 0
  @Published var buildInfo: [String: Any] = [:]

  init() {
    loadDevSettings()
    loadThemeSettings()
    loadBuildInfo()
  }

  func updateShakeGesture(_ enabled: Bool) {
    shakeToShowDevMenu = enabled
    saveDevSetting(key: "shakeToShow", value: enabled)
    DevMenuManager.shared.setMotionGestureEnabled(enabled)
  }

  func updateThreeFingerGesture(_ enabled: Bool) {
    threeFingerLongPressEnabled = enabled
    saveDevSetting(key: "threeFingerLongPress", value: enabled)
    DevMenuManager.shared.setTouchGestureEnabled(enabled)
  }

  func updateTheme(_ themeIndex: Int) {
    selectedTheme = themeIndex
    UserDefaults.standard.set(themeIndex, forKey: "ExpoGoSelectedTheme")
    applyThemeChange(themeIndex)
  }

  private func loadDevSettings() {
    shakeToShowDevMenu = DevMenuManager.shared.getMotionGestureEnabled()
    threeFingerLongPressEnabled = DevMenuManager.shared.getTouchGestureEnabled()
  }

  private func saveDevSetting(key: String, value: Bool) {
    var devMenuSettings = UserDefaults.standard.dictionary(forKey: "RCTDevMenu") ?? [:]
    devMenuSettings[key] = value
    UserDefaults.standard.set(devMenuSettings, forKey: "RCTDevMenu")
  }

  private func loadBuildInfo() {
    let buildConstants = EXBuildConstants.sharedInstance()
    let versions = EXVersions.sharedInstance()

    buildInfo = [
      "appName": Bundle.main.infoDictionary?["CFBundleDisplayName"] ?? "Expo Go",
      "appVersion": getFormattedAppVersion(),
      "expoRuntimeVersion": buildConstants?.expoRuntimeVersion ?? "Unknown",
      "supportedExpoSdks": versions.sdkVersion,
      "appIcon": getAppIcon()
    ]
  }

  private func getAppIcon() -> String {
    var appIcon = ""
    var appIconName: String?

    if let bundleIcons = Bundle.main.infoDictionary?["CFBundleIcons"] as? [String: Any],
       let primaryIcon = bundleIcons["CFBundlePrimaryIcon"] as? [String: Any],
       let iconFiles = primaryIcon["CFBundleIconFiles"] as? [String] {
      appIconName = iconFiles.last
    }

    if let appIconName, let resourcePath = Bundle.main.resourcePath {
      let appIconPath = "\(resourcePath)/\(appIconName).png"
      appIcon = "file://\(appIconPath)"
    }

    return appIcon
  }

  private func getFormattedAppVersion() -> String {
    let shortVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown"
    let buildVersion = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "Unknown"
    return "\(shortVersion) (\(buildVersion))"
  }

  private func loadThemeSettings() {
    selectedTheme = UserDefaults.standard.integer(forKey: "ExpoGoSelectedTheme")
  }

  private func applyThemeChange(_ themeIndex: Int) {
    DispatchQueue.main.async {
      guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else { return }

      UIView.transition(with: windowScene.windows.first ?? UIView(), duration: 0.3, options: .transitionCrossDissolve) {
        switch themeIndex {
        case 0: // Automatic
          windowScene.windows.first?.overrideUserInterfaceStyle = .unspecified
        case 1: // Light
          windowScene.windows.first?.overrideUserInterfaceStyle = .light
        case 2: // Dark
          windowScene.windows.first?.overrideUserInterfaceStyle = .dark
        default:
          windowScene.windows.first?.overrideUserInterfaceStyle = .unspecified
        }
      }
    }
  }
}
