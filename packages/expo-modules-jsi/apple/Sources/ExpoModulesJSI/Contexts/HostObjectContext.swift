/**
 Context that captures Swift types to pass them to JSI host object as an unmanaged pointer for interoperability with C++.
 */
internal final class HostObjectContext: Sendable {
  typealias Getter = @JavaScriptActor (_ propertyName: String) throws -> JavaScriptValue
  typealias Setter = @JavaScriptActor (_ propertyName: String, _ value: JavaScriptValue) throws -> Void
  typealias PropertyNamesGetter = @JavaScriptActor () -> [String]
  typealias Deallocator = @JavaScriptActor () -> Void

  weak let runtime: JavaScriptRuntime?
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
    self.runtime = runtime
    self.get = get
    self.set = set
    self.getPropertyNames = getPropertyNames
    self.dealloc = dealloc
  }
}
