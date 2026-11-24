internal import ExpoModulesJSI_Cxx
internal import jsi
import os

/// Base class for JS object's native state.
open class JavaScriptNativeState {
  /// Non-owning reference to the underlying C++ `expo::NativeState`. `nil` until
  /// the first `setNativeState` call materializes a pointee, and stays populated
  /// afterward (though its contents may expire when the last JSI slot drops the
  /// strong ref). `acquireShared()` transparently re-allocates if expired.
  /// Behind a lock, because objects of several runtimes can share the native state,
  /// so it can be attached on their threads at the same time.
  private let weakPointee = OSAllocatedUnfairLock<WeakPointer?>(uncheckedState: nil)

  public typealias Deallocator = (_ nativeState: JavaScriptNativeState) -> Void
  private var deallocator: Deallocator? = nil

  public init() {}

  /// Returns a `shared_ptr` to the underlying `expo::NativeState`, materializing
  /// one lazily if there's no live pointee. Called by `JavaScriptObject.setNativeState`
  /// to obtain the value to pass to JSI. Can be called on the threads of several runtimes.
  internal func acquireShared() -> expo.NativeStateShared {
    return weakPointee.withLockUnchecked { weakPointee in
      if let alive = weakPointee?.lock() {
        return alive
      }
      let context = Unmanaged.passRetained(self).toOpaque()
      let shared = expo.makeExpoNativeStateShared(context, JavaScriptNativeState.contextDeallocator)
      weakPointee = WeakPointer(shared)
      return shared
    }
  }

  /// Returns a `shared_ptr` to the underlying `expo::NativeState` while it is alive, or `nil`
  /// when no JS object holds it. Unlike `acquireShared()`, it never materializes a new one.
  internal func acquireSharedIfAlive() -> expo.NativeStateShared? {
    return weakPointee.withLockUnchecked { weakPointee in
      return weakPointee?.lock()
    }
  }

  private static let contextDeallocator: @convention(c) (UnsafeMutableRawPointer?) -> Void = { context in
    guard let context else {
      return
    }
    let unmanagedContext = Unmanaged<JavaScriptNativeState>.fromOpaque(context)
    let nativeState = unmanagedContext.takeUnretainedValue()

    nativeState.deallocator?(nativeState)
    unmanagedContext.release()
  }

  /// Sets a deallocator, a closure that is invoked when the underlying C++ pointee
  /// dies, i.e. when this native state is no longer attached to any JS object.
  /// Replaces any previously set deallocator. The same closure is used across
  /// generations if the wrapper is reattached after a release.
  public func setDeallocator(_ deallocator: @escaping Deallocator) {
    self.deallocator = deallocator
  }

  // MARK: - WeakPointer

  /// Non-owning wrapper around `expo::NativeStateWeak`. `lock()` returns a strong
  /// `shared_ptr` if the pointee is still alive, or `nil` if the last JSI slot has
  /// already dropped it.
  private struct WeakPointer {
    let inner: expo.NativeStateWeak

    init(_ shared: borrowing expo.NativeStateShared) {
      self.inner = expo.makeNativeStateWeak(shared)
    }

    func lock() -> expo.NativeStateShared? {
      let strong = inner.lock()
      return strong.__convertToBool() ? strong : nil
    }
  }
}
