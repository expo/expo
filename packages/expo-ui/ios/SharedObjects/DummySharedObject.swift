// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 A dummy shared object that demonstrates how to pass shared objects as props to SwiftUI views.
 This object contains some simple SwiftUI-related state that can be shared between JS and native.
 */
public final class DummySharedObject: SharedObject {
  /// A simple text value stored in the shared object
  var text: String = "Hello from SharedObject"

  /// A color value that can be used in SwiftUI views
  var color: Color = .blue

  /// A numeric counter value
  var counter: Int = 0

  public override init() {
    super.init()
  }

  /// Increments the counter and returns the new value
  func incrementCounter() -> Int {
    counter += 1
    return counter
  }

  /// Resets the counter to zero
  func resetCounter() {
    counter = 0
  }
}
