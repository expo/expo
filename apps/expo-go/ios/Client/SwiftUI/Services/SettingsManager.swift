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
  @Published var completedLessons: Set<Int> = []

  private static let completedLessonsKey = "ExpoGoCompletedLessons"

  init() {
    loadDevSettings()
    loadThemeSettings()
    loadBuildInfo()
    loadCompletedLessons()
  }

  // MARK: - Lesson Completion

  func isLessonCompleted(_ lessonId: Int) -> Bool {
    completedLessons.contains(lessonId)
  }

  func refreshCompletedLessons() {
    loadCompletedLessons()
  }

  private func loadCompletedLessons() {
    let ids = UserDefaults.standard.array(forKey: Self.completedLessonsKey) as? [Int] ?? []
    completedLessons = Set(ids)
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
    let buildConstants = BuildConstants.sharedInstance
    let versions = Versions.sharedInstance

    buildInfo = [
      "appName": Bundle.main.infoDictionary?["CFBundleDisplayName"] ?? "Expo Go",
      "appVersion": getFormattedAppVersion(),
      "expoRuntimeVersion": buildConstants.expoRuntimeVersion,
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
    guard let window = UIApplication.shared.connectedScenes
      .compactMap({ $0 as? UIWindowScene })
      .flatMap({ $0.windows })
      .first(where: { $0.isKeyWindow }) else {
      return
    }

    let style: UIUserInterfaceStyle
    switch themeIndex {
    case 0: // Automatic
      style = .unspecified
    case 1: // Light
      style = .light
    case 2: // Dark
      style = .dark
    default:
      style = .unspecified
    }

    UIView.transition(with: window, duration: 0.3, options: .transitionCrossDissolve) {
      window.overrideUserInterfaceStyle = style
      window.rootViewController?.setNeedsStatusBarAppearanceUpdate()
    }
  }
}
