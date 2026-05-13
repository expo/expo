// Copyright 2025-present 650 Industries. All rights reserved.

/**
 A box that holds a cleanup closure and invokes it on deallocation.
 Used to bridge Swift closures to C++ cleanup callbacks via `Unmanaged` pointers.
 */
internal final class CleanupContext: Sendable {
  let cleanup: @Sendable () -> Void

  init(_ cleanup: @escaping @Sendable () -> Void) {
    self.cleanup = cleanup
  }

  deinit {
    cleanup()
  }
}
