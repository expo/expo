import ExpoModulesJSI

/// Holds a reference to the module instance and caches its definition.
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
   The module's name. Prefers the name passed at registration, then a non-empty `Name(…)` from the
   definition, and finally `_jsName` — the `@ExpoModule` macro's synthesized name, defaulting to the
   module type name.
   */
  var name: String {
    if let _name {
      return _name
    }
    if !definition.name.isEmpty {
      return definition.name
    }
    return type(of: module)._jsName
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
    let definition =
      synthesized.isEmpty
      ? userDefinition
      : ModuleDefinition(definitions: synthesized + userDefinition.rawDefinitions)

    // A macro module describes its name through the synthesized `_jsName` rather than a `Name(…)`
    // entry, so fill it in here. The definition's name backs `__expo_module_name__` and the view
    // prototype keys, which legacy event-emitter and view-manager compatibility paths look up by
    // the registered module name — they'd otherwise key off an empty string.
    if definition.name.isEmpty {
      definition.name = type(of: module)._jsName
    }
    return definition
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
      try module._decorateModule(object: object, in: appContext.runtime)

      try installListeningHooks(on: object, in: appContext.runtime)

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
    module.willDestroy()
    post(event: .moduleDestroy)
  }

  // MARK: - Privates

  /// Installs host functions that the JavaScript `EventEmitter` implementation calls when
  /// the number of listeners for an event switches between zero and non-zero. They notify
  /// the module through the `didStartListening` and `didStopListening` lifecycle hooks.
  @JavaScriptActor
  private func installListeningHooks(on object: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) {
    let startListening = runtime.createFunction("__expo_onStartListeningToEvent") {
      [weak module = self.module] _, arguments in
      guard let module, arguments.count > 0 else {
        return .undefined
      }
      module.didStartListening(event: try arguments[0].asString())
      return .undefined
    }
    let stopListening = runtime.createFunction("__expo_onStopListeningToEvent") {
      [weak module = self.module] _, arguments in
      guard let module, arguments.count > 0 else {
        return .undefined
      }
      module.didStopListening(event: try arguments[0].asString())
      return .undefined
    }
    object.defineProperty("__expo_onStartListeningToEvent", value: startListening.asValue(), options: [])
    object.defineProperty("__expo_onStopListeningToEvent", value: stopListening.asValue(), options: [])
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
