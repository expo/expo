/// Context that captures Swift values to pass them to JSI host function as an unmanaged pointer for interoperability with C++.
internal final class HostFunctionContext: HostCallbackContext, Sendable {
  // Stored as `Unmanaged` rather than `weak`, for the same reason as in
  // ``UnownedThisHostFunctionContext`` below: the JSI host function owns the context and cannot
  // outlive its runtime, and the per-call weak load plus strong release measured at about 10 ns
  // of a no-op call through this form.
  let runtime: Unmanaged<JavaScriptRuntime>
  let name: String?
  let call: JavaScriptRuntime.SyncFunctionClosure

  init(runtime: JavaScriptRuntime, name: String? = nil, _ function: @escaping JavaScriptRuntime.SyncFunctionClosure) {
    self.runtime = Unmanaged.passUnretained(runtime)
    self.name = name
    self.call = function
  }
}

/// Counterpart to ``HostFunctionContext`` for host functions whose closure receives `this` as a
/// borrowed ``JavaScriptUnownedValue`` (see ``JavaScriptRuntime/UnownedThisSyncFunctionClosure``).
internal final class UnownedThisHostFunctionContext: HostCallbackContext, Sendable {
  // Stored as `Unmanaged` rather than `weak`: the context lives exactly as long as the JSI host
  // function that owns it (freed from the `deallocate` callback), and the host function cannot
  // outlive the runtime it was installed in. A `weak` reference here cost a `swift_weakLoadStrong`
  // plus a strong release on every host call, and profiling showed that pair as the largest single
  // item on the no-op `@JS` call floor. Callers read it through `_withUnsafeGuaranteedRef`, which
  // also skips the strong retain/release a plain `unowned(unsafe)` load would still emit. Those go
  // through the refcount side table (other wrappers hold the runtime `weak`), so they were the next
  // largest item once the weak load was gone.
  let runtime: Unmanaged<JavaScriptRuntime>
  let name: String?
  let call: JavaScriptRuntime.UnownedThisSyncFunctionClosure

  init(
    runtime: JavaScriptRuntime,
    name: String? = nil,
    _ function: @escaping JavaScriptRuntime.UnownedThisSyncFunctionClosure
  ) {
    self.runtime = Unmanaged.passUnretained(runtime)
    self.name = name
    self.call = function
  }
}
