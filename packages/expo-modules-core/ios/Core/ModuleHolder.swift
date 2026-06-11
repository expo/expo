import ExpoModulesJSI

/**
 Holds a reference to the module instance and caches its definition.
 */
public final class ModuleHolder {
  /**
   Name of the module.
   */
  private(set) var _name: String?

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
  @JavaScriptActor
  private var javaScriptObject: JavaScriptObject?

  /**
   Caches the definition of the module type.
   */
  let definition: ModuleDefinition

  /**
   Returns `definition.name` if not empty, otherwise falls back to the module type name.
   */
  var name: String {
    return _name ?? (definition.name.isEmpty ? String(describing: type(of: module)) : definition.name)
  }

  /**
   Number of JavaScript listeners attached to the module.
   */
  var listenersCount: Int = 0

  init(appContext: AppContext, module: AnyModule, name: String?) {
    self.appContext = appContext
    self._name = name
    self.module = module
    self.definition = ModuleHolder.buildDefinition(for: module)
    post(event: .moduleCreate)
  }

  /// Combines the user-authored definition with the entries synthesized by the
  /// `@ExpoModule` macro on this module's class (if any). The macro emits a
  /// `_synthesizedDefinition()` method returning an `[AnyDefinition]` array of the
  /// `Function` / `Property` / `Constructor` entries it generated from `@JS`
  /// members. Those entries are prepended to the user's definitions and the
  /// whole list is fed back through `ModuleDefinition.init` so the merged
  /// result is rebucketed (into `functions`, `properties`, etc.) just like a
  /// hand-written definition. Modules that don't use the macro fall through
  /// the empty-synthesized fast path and return the user's definition unchanged.
  private static func buildDefinition(for module: AnyModule) -> ModuleDefinition {
    let userDefinition = module.definition()
    let synthesized = module._synthesizedDefinition()
    if synthesized.isEmpty {
      return userDefinition
    }
    return ModuleDefinition(definitions: synthesized + userDefinition.rawDefinitions)
  }

  // MARK: Constants

  /**
   Merges all `constants` definitions into one dictionary.
   */
  func getLegacyConstants() -> [String: Any?] {
    return definition.getLegacyConstants()
  }

  @JavaScriptActor
  func withEventTarget<R>(_ body: (borrowing JavaScriptObject) throws -> R) rethrows -> R? {
    if javaScriptObject == nil {
      javaScriptObject = createJavaScriptModuleObject()
    }
    // Creating the object can still fail (e.g. the app context has been destroyed), in which case
    // there is nothing to emit to and we behave like `getJavaScriptValue()` by returning `nil`.
    if javaScriptObject == nil {
      return nil
    }
    return try body(javaScriptObject!)
  }

  @JavaScriptActor
  func getJavaScriptValue() -> JavaScriptValue? {
    if javaScriptObject == nil {
      javaScriptObject = createJavaScriptModuleObject()
    }
    return javaScriptObject?.asValue()
  }

  @JavaScriptActor
  func releaseJavaScriptObject() {
    javaScriptObject = nil
  }

  // MARK: JavaScript Module Object

  /**
   Creates the JavaScript object that will be used to communicate with the native module.
   The object is prefilled with module's constants and functions.
   JavaScript can access it through `global.expo.modules[moduleName]`.
   - Note: The object will be `nil` when the runtime is unavailable (e.g. remote debugger is enabled).
   */
  @JavaScriptActor
  private func createJavaScriptModuleObject() -> JavaScriptObject? {
    // It might be impossible to create any object at the moment (e.g. remote debugging, app context destroyed)
    guard let appContext else {
      return nil
    }
    do {
      log.info("Creating JS object for module '\(name)'")
      let object = try definition.build(appContext: appContext)

      // Install the `@JS` members the `@ExpoModule` macro binds directly into the JS object
      // (the direct-JSI path). A no-op for modules that don't use the macro.
      try module._decorateModule(object: object, in: appContext.runtime, appContext: appContext)

      return object
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
