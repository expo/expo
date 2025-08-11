// Copyright 2015-present 650 Industries. All rights reserved.

class DevLauncherTabBarManager {
  static let shared = DevLauncherTabBarManager()

  private var originalStandardAppearance: UITabBarAppearance?
  private var originalScrollEdgeAppearance: UITabBarAppearance?

  private init() {}

  func setCustomAppearance() {
    if originalStandardAppearance == nil {
      originalStandardAppearance = UITabBar.appearance().standardAppearance
      originalScrollEdgeAppearance = UITabBar.appearance().scrollEdgeAppearance
    }

    let appearance = UITabBarAppearance()
    appearance.configureWithOpaqueBackground()

    UITabBar.appearance().standardAppearance = appearance
    UITabBar.appearance().scrollEdgeAppearance = appearance
  }

  func restoreOriginalAppearance() {
    if let originalStandardAppearance {
      UITabBar.appearance().standardAppearance = originalStandardAppearance
    }
    if let originalScrollEdgeAppearance {
      UITabBar.appearance().scrollEdgeAppearance = originalScrollEdgeAppearance
    }
  }
}
