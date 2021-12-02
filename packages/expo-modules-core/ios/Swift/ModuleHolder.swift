import Dispatch

/**
 Holds a reference to the module instance and caches its definition.
 */
public final class ModuleHolder {
  /**
   Instance of the module.
   */
  private(set) var module: AnyModule

  /**
   A weak reference to the app context.
   */
  private(set) weak var appContext: AppContext?

  /**
   Caches the definition of the module type.
   */
  let definition: ModuleDefinition

  /**
   Returns `definition.name` if not empty, otherwise falls back to the module type name.
   */
  var name: String {
    return definition.name.isEmpty ? String(describing: type(of: module)) : definition.name
  }

  /**
   Number of JavaScript listeners attached to the module.
   */
  var listenersCount: Int = 0

  init(appContext: AppContext, module: AnyModule) {
    self.appContext = appContext
    self.module = module
    self.definition = module.definition()
    post(event: .moduleCreate)
  }

  // MARK: Constants

  /**
   Merges all `constants` definitions into one dictionary.
   */
  func getConstants() -> [String: Any?] {
    return definition.constants.reduce(into: [String: Any?]()) { dict, definition in
      dict.merge(definition.body()) { $1 }
    }
  }

  // MARK: Calling functions

  func call(function functionName: String, args: [Any], promise: Promise) {
    do {
      guard let function = definition.functions[functionName] else {
        throw FunctionNotFoundError(functionName: functionName, moduleName: self.name)
      }
      let queue = function.queue ?? DispatchQueue.global(qos: .default)

      queue.async {
        function.call(args: args, promise: promise)
      }
    } catch let error as CodedError {
      promise.reject(error)
    } catch {
      promise.reject(UnexpectedError(error))
    }
  }

  func call(function functionName: String, args: [Any], _ callback: @escaping (Any?, CodedError?) -> Void = { _, _ in }) {
    let promise = Promise {
      callback($0, nil)
    } rejecter: {
      callback(nil, $0)
    }
    call(function: functionName, args: args, promise: promise)
  }

  @discardableResult
  func callSync(function functionName: String, args: [Any]) -> Any? {
    if let function = definition.functions[functionName] {
      return function.callSync(args: args)
    }
    return nil
  }

  // MARK: Listening to native events

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

  // MARK: JavaScript events

  /**
   Modifies module's listeners count and calls `onStartObserving` or `onStopObserving` accordingly.
   */
  func modifyListenersCount(_ count: Int) {
    if count > 0 && listenersCount == 0 {
      let _ = definition.functions["startObserving"]?.callSync(args: [])
    } else if count < 0 && listenersCount + count <= 0 {
      let _ = definition.functions["stopObserving"]?.callSync(args: [])
    }
    listenersCount = max(0, listenersCount + count)
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

  struct FunctionNotFoundError: CodedError {
    let functionName: String
    let moduleName: String
    var description: String {
      "Cannot find function `\(functionName)` in module `\(moduleName)`"
    }
  }
}
