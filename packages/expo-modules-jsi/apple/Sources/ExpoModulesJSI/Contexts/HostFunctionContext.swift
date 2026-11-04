/// Context that captures Swift values to pass them to JSI host function as an unmanaged pointer for interoperability with C++.
/// Every host function closure type is adapted to ``JavaScriptRuntime/HostFunctionClosure``, so this is
/// the only host function context.
internal final class HostFunctionContext: HostCallbackContext, Sendable {
  // Stored as `Unmanaged` rather than `weak`: the context lives exactly as long as the JSI host
  // function that owns it (freed from the `deallocate` callback), and the host function cannot
  // outlive the runtime it was installed in. A `weak` reference here cost a `swift_weakLoadStrong`
  // plus a strong release on every host call, and profiling showed that pair as the largest single
  // item on the no-op `@JS` call floor. Callers read it through `_withUnsafeGuaranteedRef`, which
  // also skips the strong retain/release a plain `unowned(unsafe)` load would still emit.
  let runtime: Unmanaged<JavaScriptRuntime>
  let call: JavaScriptRuntime.HostFunctionClosure

  init(runtime: JavaScriptRuntime, _ function: @escaping JavaScriptRuntime.HostFunctionClosure) {
    self.runtime = Unmanaged.passUnretained(runtime)
    self.call = function
  }
}
