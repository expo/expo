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
/// Unlike a `weak` reference, the liveness check is not atomic and does not keep the runtime alive for
/// the rest of the call. Values must not be used concurrently with the runtime's `deinit`, which holds
/// as long as the last reference to the runtime is released on the JavaScript thread (as
/// `AppContext.destroy()` does).
///
/// Not to be confused with the engine's handles to JavaScript values (`jsi::PointerValue`).
internal final class JavaScriptRuntimeHandle: @unchecked Sendable {
  /// The runtime that owns this handle, cleared by the runtime's `deinit`. Read it through ``runtime``
  /// instead.
  private unowned(unsafe) var unsafeRuntime: JavaScriptRuntime?

  /// The engine runtime, cleared by the runtime's `deinit`. Liveness is checked on this field rather
  /// than on ``unsafeRuntime``: `IRuntime` is an immortal reference, so reading it and checking it for
  /// `nil` costs no reference counting, whereas checking the runtime reference for `nil` retains the
  /// runtime, which is the slow-path traffic this handle exists to avoid.
  nonisolated(unsafe) private var jsiRuntime: facebook.jsi.IRuntime?

  internal init(_ pointee: facebook.jsi.IRuntime) {
    self.jsiRuntime = pointee
  }

  /// Links the handle to its runtime. Called at the end of the runtime's initializers, once `self`
  /// is available.
  internal func attach(_ runtime: JavaScriptRuntime) {
    unsafeRuntime = runtime
  }

  /// Marks the runtime as gone. Called from the runtime's `deinit`.
  internal func detach() {
    jsiRuntime = nil
    unsafeRuntime = nil
  }

  /// Whether the runtime that owns this handle is still alive.
  @inline(__always)
  internal var isAlive: Bool {
    return jsiRuntime != nil
  }

  /// The runtime, or `nil` if it has been deallocated.
  @inline(__always)
  internal var runtime: JavaScriptRuntime? {
    return isAlive ? unsafeRuntime : nil
  }

  /// The engine runtime, or `nil` if the runtime has been deallocated.
  @inline(__always)
  internal var pointee: facebook.jsi.IRuntime? {
    return jsiRuntime
  }
}
