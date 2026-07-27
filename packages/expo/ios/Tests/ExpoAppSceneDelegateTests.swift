// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
@testable import Expo

#if os(iOS) || os(tvOS)

@Suite
struct ExpoAppSceneDelegateTests {
  @Test
  func `extends UIResponder`() {
    // Assert that `ExpoAppSceneDelegate` extends from `UIResponder` so it doesn't regress in the future.
    // UIKit instantiates the scene delegate by name and expects a responder; losing this would break
    // responder-chain behavior such as key presses.
    #expect(ExpoAppSceneDelegate.self is UIResponder.Type)
  }

  @Test
  func `conforms to UIWindowSceneDelegate`() {
    // The iOS 27 SDK asserts at launch unless the app's scene delegate adopts the scene life cycle.
    // Conforming to `UIWindowSceneDelegate` is what makes the class usable as the scene delegate.
    #expect(ExpoAppSceneDelegate.self is UIWindowSceneDelegate.Type)
  }

  @Test
  @MainActor
  func `builds launch options carrying a cold-start URL`() {
    // Under the scene life cycle the URL that cold-started the app arrives in the scene connection
    // options, not in the app delegate's launch options. Synthesizing launch options from it is
    // what lets `Linking.getInitialURL()` (which reads `UIApplicationLaunchOptionsURLKey`) return
    // the URL, matching the app-delegate life cycle it replaced.
    let url = URL(string: "bareexpo://test-suite/run?tests=AppMetrics")!
    let launchOptions = ExpoAppSceneDelegate.launchOptions(url: url, userActivity: nil)
    let urlKey = UIApplication.LaunchOptionsKey(rawValue: "UIApplicationLaunchOptionsURLKey")
    #expect(launchOptions?[urlKey] as? URL == url)
  }

  @Test
  @MainActor
  func `builds launch options carrying a browsing-web user activity`() {
    let userActivity = NSUserActivity(activityType: NSUserActivityTypeBrowsingWeb)
    userActivity.webpageURL = URL(string: "https://expo.dev/link")!
    let launchOptions = ExpoAppSceneDelegate.launchOptions(url: nil, userActivity: userActivity)
    let userActivityDictionaryKey = UIApplication.LaunchOptionsKey(
      rawValue: "UIApplicationLaunchOptionsUserActivityDictionaryKey"
    )
    let activityDictionary = launchOptions?[userActivityDictionaryKey] as? [AnyHashable: Any]
    #expect(activityDictionary?["UIApplicationLaunchOptionsUserActivityTypeKey"] as? String == NSUserActivityTypeBrowsingWeb)
    #expect((activityDictionary?["UIApplicationLaunchOptionsUserActivityKey"] as? NSUserActivity) === userActivity)
  }

  @Test
  @MainActor
  func `returns nil launch options without a URL or user activity`() {
    #expect(ExpoAppSceneDelegate.launchOptions(url: nil, userActivity: nil) == nil)
  }
}

#endif
