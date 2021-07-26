
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

    post(event: .moduleCreate)
  }

  // MARK: Calling methods

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

  // MARK: Listening to events

  func listeners(forEvent event: EventName) -> [EventListener] {
    return definition.eventListeners.filter {
      $0.name == event
    }
  }

  func post(event: EventName) {
    listeners(forEvent: event).forEach {
      $0.call(nil)
    }
  }

  func post<PayloadType>(event: EventName, payload: PayloadType?) {
    listeners(forEvent: event).forEach {
      $0.call(payload)
    }
  }

  // MARK: Deallocation

  deinit {
    post(event: .moduleDestroy)
  }
}
