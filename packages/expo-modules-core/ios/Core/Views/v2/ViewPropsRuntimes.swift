// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation

/// The runtime that the props decoders of v2 views use on each thread for props that come as `folly::dynamic`,
/// without a runtime: from Reanimated, React Native's animations, and every update of a view after
/// `setNativeProps`. A value converted from `folly::dynamic` doesn't depend on the runtime that converted it, so
/// any runtime that is safe to use on the thread works: the React Native runtime on its JavaScript thread, and the
/// worklets UI runtime on the main thread.
internal enum ViewPropsRuntimes {
  /// Makes `runtime` the runtime of the current thread, in place of the one registered before. The thread keeps
  /// its handle, so a runtime that goes away isn't used. It keeps a runtime that other threads use too.
  static func registerForCurrentThread(_ runtime: JavaScriptRuntime) {
    let entry = Unmanaged.passRetained(Entry(runtime: runtime)).toOpaque()
    if let oldEntry = pthread_getspecific(entryKey) {
      Unmanaged<Entry>.fromOpaque(oldEntry).release()
    }
    pthread_setspecific(entryKey, entry)
  }

  /// Runs `body` with a pointer to the `jsi::Runtime` of the runtime of the current thread, holding its lock if it
  /// has one, and returns `true`. Returns `false` without running `body` when the thread has no live runtime.
  static func withRuntimeForCurrentThread(_ body: (UnsafeRawPointer) -> Void) -> Bool {
    guard let entryPointer = pthread_getspecific(entryKey) else {
      return false
    }
    let entry = Unmanaged<Entry>.fromOpaque(entryPointer).takeUnretainedValue()
    guard let runtime = entry.handle.runtime else {
      return false
    }
    guard let locking = entry.locking else {
      runtime.withUnsafePointee { body(UnsafeRawPointer($0)) }
      return true
    }
    return locking.withLock { runtime.withUnsafePointee { body(UnsafeRawPointer($0)) } }
  }

  // MARK: - Entries

  private final class Entry {
    // Not a `weak` reference to the runtime, which would make each retain and release of the runtime slower.
    let handle: JavaScriptRuntimeHandle
    // Kept strongly, because only the thread that releases a runtime can read its handle safely, and other threads
    // use this runtime too. `withLock` returns `false` when the engine runtime is gone.
    let locking: (any JavaScriptRuntimeLocking)?

    init(runtime: JavaScriptRuntime) {
      self.handle = runtime.handle
      self.locking = runtime as? any JavaScriptRuntimeLocking
    }
  }

  /// The key of the current thread's entry. Its destructor releases the entry when the thread exits.
  private static let entryKey: pthread_key_t = {
    var key = pthread_key_t()
    pthread_key_create(&key) { entry in
      Unmanaged<Entry>.fromOpaque(entry).release()
    }
    return key
  }()
}
