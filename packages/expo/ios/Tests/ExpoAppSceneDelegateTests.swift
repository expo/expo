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
}

#endif
