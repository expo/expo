
/**
 Holds a reference to the module instance and caches its definition.
 */
public class ModuleHolder {
  private(set) var module: AnyModule

  private(set) lazy var definition: ModuleDefinition = module.definition()

  var name: String {
    return definition.name ?? String(describing: type(of: module))
  }

  init(module: AnyModule) {
    self.module = module

    // FIXME: Temporarily preload the definition
    self.definition.constants
  }

  func call(method methodName: String, args: [Any?], promise: Promise) {
    if let method = definition.methods[methodName] {
      let queue = method.queue ?? DispatchQueue.global(qos: .default)
      queue.async {
        method.call(args: args, promise: promise)
      }
    } else {
      promise.reject("Method \"\(methodName)\" is not exported by \(name)")
    }
  }
}
