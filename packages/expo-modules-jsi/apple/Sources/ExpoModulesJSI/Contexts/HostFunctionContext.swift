/// Context that captures Swift values to pass them to JSI host function as an unmanaged pointer for interoperability with C++.
internal final class HostFunctionContext: Sendable {
  weak let runtime: JavaScriptRuntime?
  let name: String?
  let call: JavaScriptRuntime.SyncFunctionClosure

  init(runtime: JavaScriptRuntime, name: String? = nil, _ function: @escaping JavaScriptRuntime.SyncFunctionClosure) {
    self.runtime = runtime
    self.name = name
    self.call = function
  }
}

/// Counterpart to ``HostFunctionContext`` for host functions whose closure receives `this` as a
/// borrowed ``JavaScriptUnownedValue`` (see ``JavaScriptRuntime/UnownedThisSyncFunctionClosure``).
internal final class UnownedThisHostFunctionContext: Sendable {
  weak let runtime: JavaScriptRuntime?
  let name: String?
  let call: JavaScriptRuntime.UnownedThisSyncFunctionClosure

  init(
    runtime: JavaScriptRuntime, name: String? = nil,
    _ function: @escaping JavaScriptRuntime.UnownedThisSyncFunctionClosure
  ) {
    self.runtime = runtime
    self.name = name
    self.call = function
  }
}
