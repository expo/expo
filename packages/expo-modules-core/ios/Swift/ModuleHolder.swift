import Dispatch

/**
 Holds a reference to the module instance and caches its definition.
 */
public class ModuleHolder {
  /**
   Lazy-loaded instance of the module. Created from module's definition.
   */
  private(set) var module: AnyModule?

  /**
   A weak reference to the app context.
   */
  private(set) weak var appContext: AppContext?

  /**
   Caches the definition of the module type.
   */
  let definition: ModuleDefinition

  /**
   Shorthand form of `definition.name`.
   */
  var name: String { definition.name }

  init(appContext: AppContext, definition: ModuleDefinition) {
    self.appContext = appContext
    self.definition = definition
  }

  /**
   Creates (if needed) and returns the module based on associated definition and then returns it.
   */
  func getInstance() throws -> AnyModule? {
    guard let appContext = appContext else {
      throw AppContext.DeallocatedAppContextError()
    }
    if module == nil, let moduleType = definition.type {
      module = moduleType.init(appContext: appContext)
      post(event: .moduleCreate)
    }
    return module
  }

  /**
   Whether held module is or would be (instance may not be created yet) of given type.
   */
  func isOfType<ModuleType>(_ type: ModuleType.Type) -> Bool {
    return definition.type is ModuleType.Type
  }

  // MARK: Calling methods

  func call(method methodName: String, args: [Any?], promise: Promise) {
    do {
      guard let module = try getInstance() else {
        throw ModuleNotFoundError(moduleName: self.name)
      }
      guard let method = definition.methods[methodName] else {
        throw MethodNotFoundError(methodName: methodName, moduleName: self.name)
      }
      let queue = method.queue ?? DispatchQueue.global(qos: .default)

      queue.async {
        method.call(module: module, args: args, promise: promise)
      }
    } catch let error as CodedError {
      promise.reject(error)
    } catch {
      promise.reject(UnexpectedError(error))
    }
  }

  func call(method methodName: String, args: [Any?], _ callback: @escaping (Any?, CodedError?) -> Void = { _, _ in }) {
    let promise = Promise {
      callback($0, nil)
    } rejecter: {
      callback(nil, $0)
    }
    call(method: methodName, args: args, promise: promise)
  }

  func callSync(method methodName: String, args: [Any?]) -> Any? {
    if let method = definition.methods[methodName] {
      return method.callSync(args: args)
    }
    return nil
  }

  // MARK: Listening to events

  func listeners(forEvent event: EventName) -> [EventListener] {
    return definition.eventListeners.filter {
      $0.name == event
    }
  }

  func post(event: EventName) {
    listeners(forEvent: event).forEach {
      try? $0.call(module, nil)
    }
  }

  func post<PayloadType>(event: EventName, payload: PayloadType?) {
    listeners(forEvent: event).forEach {
      try? $0.call(module, payload)
    }
  }

  // MARK: Deallocation

  deinit {
    post(event: .moduleDestroy)
  }

  // MARK: Errors

  struct ModuleNotFoundError: CodedError {
    let moduleName: String
    var description: String {
      "Cannot find module `\(moduleName)`"
    }
  }

  struct MethodNotFoundError: CodedError {
    let methodName: String
    let moduleName: String
    var description: String {
      "Cannot find method `\(methodName)` in module `\(moduleName)`"
    }
  }
}
