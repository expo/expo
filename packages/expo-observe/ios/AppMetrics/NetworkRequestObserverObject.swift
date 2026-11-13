// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// The JS `NetworkRequestObserver` object. Each JS `new NetworkRequestObserver()` allocates one,
/// which emits the events of its `NetworkRequestObserver` until JS drops the reference.
final class NetworkRequestObserverObject: SharedObject, @unchecked Sendable {
  private var observer: NetworkRequestObserver?

  init(filter: NetworkRequestFilter?) {
    super.init()
    // Weak, so the observer's callback does not keep this object alive.
    observer = NetworkRequestObserver(filter: filter) { [weak self] name, payload in
      self?.emit(event: name, payload: payload)
    }
  }

  func setFilter(_ filter: NetworkRequestFilter?) {
    observer?.setFilter(filter)
  }

  override func sharedObjectWillRelease() {
    observer?.stop()
    super.sharedObjectWillRelease()
  }
}
