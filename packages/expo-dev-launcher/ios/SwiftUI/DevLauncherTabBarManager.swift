// Copyright 2015-present 650 Industries. All rights reserved.

class DevLauncherTabBarManager {
  static let shared = DevLauncherTabBarManager()
  private init() {}

#if os(iOS) || os(tvOS)
  private var originalStandardAppearance: UITabBarAppearance?
  private var originalScrollEdgeAppearance: UITabBarAppearance?

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
#else
  func setCustomAppearance() {
    // No-op on macOS
  }

  func restoreOriginalAppearance() {
    // No-op on macOS
  }
#endif
}
