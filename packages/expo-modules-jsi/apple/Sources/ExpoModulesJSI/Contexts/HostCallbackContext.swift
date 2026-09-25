/// A context object handed to JSI as an opaque pointer, owned by the JSI host function or host
/// object it was created for and freed from that owner's deallocate callback.
internal protocol HostCallbackContext: AnyObject {
  /// The runtime the owner was installed in. Stored as `Unmanaged` rather than `weak`: the owner
  /// lives in the runtime's heap, so a callback can only run while the runtime is alive and
  /// executing JS, and a `weak` load plus a strong release per call was the largest single cost
  /// of a no-op host call.
  var runtime: Unmanaged<JavaScriptRuntime> { get }
}

/// Runs `body` with guaranteed references to the context behind `pointer` and to its runtime.
/// `_withUnsafeGuaranteedRef` promises the compiler that both objects outlive the closure, so no
/// retain or release is emitted for either. Both promises hold for a JSI callback: the JSI owner
/// of the context is the caller, and a synchronous callback runs while the runtime executes JS,
/// with the wrapper owned for the runtime's whole lifetime. The body's result must be `Copyable`
/// because `_withUnsafeGuaranteedRef` requires it; callbacks write their `jsi::Value` result into the
/// slot the C++ caller provides and return only whether an error was stored.
@inline(__always)
internal func withGuaranteedContext<Context: HostCallbackContext, Result>(
  _ pointer: UnsafeMutableRawPointer,
  _ body: (_ context: Context, _ runtime: JavaScriptRuntime) -> Result
) -> Result {
  return Unmanaged<Context>.fromOpaque(pointer)._withUnsafeGuaranteedRef { context in
    return context.runtime._withUnsafeGuaranteedRef { runtime in
      return body(context, runtime)
    }
  }
}
