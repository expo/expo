// Copyright 2026-present 650 Industries. All rights reserved.

internal import jsi

/// A strong handle to a ``JavaScriptRuntime`` that values hold instead of a `weak` reference to the
/// runtime itself.
///
/// A `weak` reference gives the runtime a side table, and from then on every strong retain and
/// release of the runtime takes the slow atomic path, on top of the cost of the weak loads, stores and
/// destroys. Values did all of these on every access. The handle is never weakly referenced, so the
/// retain and release that storing it costs stay on the inline fast path, and reading the engine
/// runtime through it costs no ARC at all: `IRuntime` is imported as an immortal reference.
///
/// The runtime owns its handle and marks it dead in `deinit`, so values that outlive the runtime still
/// detect it through ``runtime`` or ``pointee`` returning `nil`.
///
/// ``runtime`` and ``pointee`` are not atomic, so they are only for the thread that uses the runtime:
/// the JavaScript thread, or Hermes's finalizer thread while the runtime is destroyed. The runtime's
/// `deinit` runs there too as long as the last reference is released there (as `AppContext.destroy()`
/// does). Other threads go through ``JavaScriptRuntime/Scheduler``.
///
/// Not to be confused with the engine's handles to JavaScript values (`jsi::PointerValue`).
internal final class JavaScriptRuntimeHandle: @unchecked Sendable {
  /// The runtime that owns this handle, cleared by the runtime's `deinit`. Read it through ``runtime``
  /// instead. `Unmanaged`, so ``unretainedRuntime`` can read it without retaining the runtime.
  private var unmanagedRuntime: Unmanaged<JavaScriptRuntime>?

  /// The engine runtime, cleared by the runtime's `deinit`. Liveness is checked on this field:
  /// `IRuntime` is an immortal reference, so reading it and checking it for `nil` costs no reference
  /// counting.
  nonisolated(unsafe) private var jsiRuntime: facebook.jsi.IRuntime?

  internal init(_ pointee: facebook.jsi.IRuntime) {
    self.jsiRuntime = pointee
  }

  /// Links the handle to its runtime. Called at the end of the runtime's initializers, once `self`
  /// is available.
  internal func attach(_ runtime: JavaScriptRuntime) {
    unmanagedRuntime = Unmanaged.passUnretained(runtime)
  }

  /// Marks the runtime as gone. Called from the runtime's `deinit`.
  internal func detach() {
    jsiRuntime = nil
    unmanagedRuntime = nil
  }

  /// Whether the runtime that owns this handle is still alive.
  @inline(__always)
  internal var isAlive: Bool {
    return jsiRuntime != nil
  }

  /// The runtime, or `nil` if it has been deallocated.
  @inline(__always)
  internal var runtime: JavaScriptRuntime? {
    return isAlive ? unmanagedRuntime?.takeUnretainedValue() : nil
  }

  /// The runtime without a retain, or `nil` if it has been deallocated. Only valid while the runtime
  /// can't be deallocated, such as during a call on its JavaScript thread.
  @inline(__always)
  internal var unretainedRuntime: Unmanaged<JavaScriptRuntime>? {
    return isAlive ? unmanagedRuntime : nil
  }

  /// The engine runtime, or `nil` if the runtime has been deallocated.
  @inline(__always)
  internal var pointee: facebook.jsi.IRuntime? {
    return jsiRuntime
  }
}
