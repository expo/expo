// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 * A SharedObject observable by SwiftUI.
 *
 * Created from JavaScript via `useNativeState(false)`.
 *
 * Example (in a SwiftUI view):
 *
 *   Toggle(label, isOn: state.binding(false))
 */
internal class ObservableState: SharedObject, ObservableObject {
  @Published var value: Any?

  init(value: Any?) {
    self.value = value
  }

  func binding<T>(_ fallback: T) -> Binding<T> {
    Binding(
      get: { self.value as? T ?? fallback },
      set: { self.value = $0 }
    )
  }
}
