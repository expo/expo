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
  var onChange: WorkletCallback?
  private var isNotifying = false

  @Published var value: Any? {
    didSet {
      guard !isNotifying else { return }
      isNotifying = true
      defer { isNotifying = false }
      onChange?.invoke(arguments: [value ?? NSNull()])
    }
  }

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
