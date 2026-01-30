
internal class HostObjectContext {
  let runtime: JavaScriptRuntime
  let get: (String) -> JavaScriptValue
  let set: (String, consuming JavaScriptValue) -> Void
  let getPropertyNames: () -> [String]
  let dealloc: () -> Void

  init(
    runtime: JavaScriptRuntime,
    _ get: @escaping (String) -> JavaScriptValue,
    _ set: @escaping (String, consuming JavaScriptValue) -> Void,
    _ getPropertyNames: @escaping () -> [String],
    _ dealloc: @escaping () -> Void
  ) {
    self.runtime = runtime
    self.get = get
    self.set = set
    self.getPropertyNames = getPropertyNames
    self.dealloc = dealloc
  }
}
