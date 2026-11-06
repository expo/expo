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
@SharedObject
internal final class ObservableState: SharedObject, ObservableObject {
  var onChange: WorkletCallback?
  private var isNotifying = false

  @Published var value: Any? {
    didSet {
      // Skip re-invoking onChange if state.value was written from inside onChange.
      guard !isNotifying else { return }
      isNotifying = true
      defer { isNotifying = false }
      onChange?.invoke(arguments: [value ?? NSNull()])
    }
  }

  init(value: Any?) {
    self.value = value
  }

  // `value`, `get` and `set` are bound with `@JS`, so they are also on the object that a worklet gets.
  // On Android, `useNativeState` defines them in JavaScript.

  @JS("value")
  var currentValue: Any? {
    get {
      return value
    }
    set {
      setValueOnMainThread(newValue)
    }
  }

  @JS
  func get() -> Any? {
    return value
  }

  @JS
  func set(_ newValue: Any?) {
    setValueOnMainThread(newValue)
  }

  /// Sets the value on the main thread, which SwiftUI observes it on.
  func setValueOnMainThread(_ newValue: Any?) {
    if Thread.isMainThread {
      value = newValue
    } else {
      DispatchQueue.main.async {
        self.value = newValue
      }
    }
  }

  func binding<T>(_ fallback: T) -> Binding<T> {
    Binding(
      get: { self.value as? T ?? fallback },
      set: { self.value = $0 }
    )
  }
}
