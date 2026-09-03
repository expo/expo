/// Context that captures Swift types to pass them to JSI host object as an unmanaged pointer for interoperability with C++.
internal final class HostObjectContext: HostCallbackContext, Sendable {
  typealias Getter = @JavaScriptActor (_ propertyName: String) throws -> JavaScriptValue
  typealias Setter = @JavaScriptActor (_ propertyName: String, _ value: JavaScriptValue) throws -> Void
  typealias PropertyNamesGetter = @JavaScriptActor () -> [String]
  typealias Deallocator = @JavaScriptActor () -> Void

  // Stored as `Unmanaged` rather than `weak`: the JSI host object owns the context (freed from the
  // `deallocate` callback when the JS object is collected) and lives in the runtime's heap, so a
  // getter or setter can only run while the runtime is alive and executing JS. Skips a weak load
  // plus a strong release on every property access; see ``UnownedThisHostFunctionContext``.
  let runtime: Unmanaged<JavaScriptRuntime>
  let get: Getter
  let set: Setter?
  let getPropertyNames: PropertyNamesGetter
  let dealloc: Deallocator

  init(
    runtime: JavaScriptRuntime,
    _ get: @escaping Getter,
    _ set: Setter?,
    _ getPropertyNames: @escaping PropertyNamesGetter,
    _ dealloc: @escaping Deallocator
  ) {
    self.runtime = Unmanaged.passUnretained(runtime)
    self.get = get
    self.set = set
    self.getPropertyNames = getPropertyNames
    self.dealloc = dealloc
  }
}
