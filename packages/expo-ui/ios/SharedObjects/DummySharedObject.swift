// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI
import Combine

/**
 A dummy shared object that demonstrates how to pass shared objects as props to SwiftUI views.
 This object conforms to ObservableObject so SwiftUI views can reactively update when properties change.
 */
public final class DummySharedObject: SharedObject, ObservableObject {
  /// A simple text value stored in the shared object
  @Published var text: String = "Hello from SharedObject"

  /// A color value that can be used in SwiftUI views
  @Published var color: Color = .blue

  /// A numeric counter value
  @Published var counter: Int = 0

  public override init() {
    super.init()
  }

  /// Increments the counter and returns the new value
  @discardableResult
  func incrementCounter() -> Int {
    counter += 1
    return counter
  }

  /// Resets the counter to zero
  func resetCounter() {
    counter = 0
  }
}
