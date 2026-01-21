// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI
import Combine

/**
 A shared object that wraps a single observable String value.
 Can be used to create two-way bindings between JavaScript and SwiftUI views like TextField.
 */
public final class NativeStateString: SharedObject, ObservableObject {
  /// The string value
  @Published public var value: String = ""

  public override init() {
    super.init()
  }

  /// Convenience initializer with an initial value
  convenience init(initialValue: String) {
    self.init()
    self.value = initialValue
  }
}
