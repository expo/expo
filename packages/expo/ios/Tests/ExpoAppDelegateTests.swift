// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
@testable import Expo

@Suite
struct ExpoAppDelegateTests {
  @Test
  func `extends UIResponder`() {
    // Assert that `ExpoAppDelegate` extends from `UIResponder` so it doesn't regress again in the future.
    // Otherwise, the `AppDelegate` would lose its responder behavior such as being able to handle touches and key presses.
    #expect(ExpoAppDelegate.self is UIResponder.Type)
  }
}
