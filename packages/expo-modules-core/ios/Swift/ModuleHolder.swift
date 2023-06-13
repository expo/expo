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
   JavaScript object that represents the module instance in the runtime.
   */
  public internal(set) lazy var javaScriptObject: JavaScriptObject? = createJavaScriptModuleObject()

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
   Shortcut to get the underlying view manager definition.
   */
  var viewManager: ViewManagerDefinition? {
    return definition.viewManager
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
    return definition.getConstants()
  }

  // MARK: Calling functions

  func call(function functionName: String, args: [Any], _ callback: @escaping (FunctionCallResult) -> () = { _ in }) {
    guard let appContext else {
      callback(.failure(Exceptions.AppContextLost()))
      return
    }
    guard let function = definition.functions[functionName] else {
      callback(.failure(FunctionNotFoundException((functionName: functionName, moduleName: self.name))))
      return
    }
    function.call(by: self, withArguments: args, appContext: appContext, callback: callback)
  }

  @discardableResult
  func callSync(function functionName: String, args: [Any]) -> Any? {
    guard let appContext, let function = definition.functions[functionName] as? AnySyncFunctionComponent else {
      return nil
    }
    do {
      let arguments = try cast(arguments: args, forFunction: function, appContext: appContext)
      let result = try function.call(by: self, withArguments: arguments, appContext: appContext)

      if let result = result as? SharedObject {
        let jsObject = SharedObjectRegistry.ensureSharedJavaScriptObject(runtime: try appContext.runtime, nativeObject: result)
        return jsObject
      }
      return result
    } catch {
      return error
    }
  }

  // MARK: JavaScript Module Object

  /**
   Creates the JavaScript object that will be used to communicate with the native module.
   The object is prefilled with module's constants and functions.
   JavaScript can access it through `global.expo.modules[moduleName]`.
   - Note: The object will be `nil` when the runtime is unavailable (e.g. remote debugger is enabled).
   */
  private func createJavaScriptModuleObject() -> JavaScriptObject? {
    // It might be impossible to create any object at the moment (e.g. remote debugging, app context destroyed)
    guard let appContext else {
      return nil
    }
    do {
      log.info("Creating JS object for module '\(name)'")
      return try definition.build(appContext: appContext)
    } catch {
      log.error("Building the module object failed: \(error)")
      return nil
    }
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
    guard let appContext else {
      return
    }
    if count > 0 && listenersCount == 0 {
      definition.functions["startObserving"]?.call(withArguments: [], appContext: appContext)
    } else if count < 0 && listenersCount + count <= 0 {
      definition.functions["stopObserving"]?.call(withArguments: [], appContext: appContext)
    }
    listenersCount = max(0, listenersCount + count)
  }

  // MARK: Deallocation

  deinit {
    post(event: .moduleDestroy)
  }

  // MARK: - Exceptions

  internal class ModuleNotFoundException: GenericException<String> {
    override var reason: String {
      "Module '\(param)' not found"
    }
  }

  internal class FunctionNotFoundException: GenericException<(functionName: String, moduleName: String)> {
    override var reason: String {
      "Function '\(param.functionName)' not found in module '\(param.moduleName)'"
    }
  }
}
