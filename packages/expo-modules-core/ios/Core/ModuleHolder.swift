internal import React
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

  /// The native state of `javaScriptObject`, which keeps its event listeners.
  @JavaScriptActor
  private var eventEmitterState: ModuleEventEmitterNativeState?

  /// The ID for the next created holder.
  private static let nextHolderId = Mutex<UInt64>(0)

  /// A process-wide unique ID of the holder. Module objects cached by attached runtimes are tied to it.
  private let holderId: UInt64 = ModuleHolder.nextHolderId.withLock { id in
    defer { id += 1 }
    return id
  }

  /**
   Caches the definition of the module type.
   */
  let definition: ModuleDefinition

  /**
   The `@ExpoView` views that the module registers with `@ExpoModule(views:)`, keyed by the view name,
   which is the view's `_jsName`. When the definition has no views, the first one is also the
   module's default view, as the first view of the definition is. A view whose name another view of
   the module already has isn't included.
   */
  let nativeViewTypes: [String: any AnyNativeView.Type]

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
    self.nativeViewTypes = ModuleHolder.nativeViewTypes(of: module, definitionViews: definition.views)
    (module as? BaseModule)?.holder = self
    post(event: .moduleCreate)
  }

  /// Merges the entries from `_synthesizedDefinition()` into the user-authored definition. Only module
  /// binaries built with earlier `@ExpoModule` macros return any, so other modules take the fast path.
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

  private static func nativeViewTypes(
    of module: AnyModule,
    definitionViews: [String: AnyViewDefinition]
  ) -> [String: any AnyNativeView.Type] {
    var viewTypes: [String: any AnyNativeView.Type] = [:]

    for viewType in type(of: module)._viewTypes {
      let viewName = viewType._jsName

      if viewTypes[viewName] != nil || definitionViews[viewName] != nil {
        log.error(
          "The view '\(viewType)' of module '\(type(of: module))' isn't registered, because the module already has a view named '\(viewName)'"
        )
        continue
      }
      if viewTypes.isEmpty && definitionViews.isEmpty {
        viewTypes[DEFAULT_MODULE_VIEW] = viewType
      }
      viewTypes[viewName] = viewType
    }
    return viewTypes
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

  /// Returns the module object in a runtime other than the main runtime. The object has only the members that
  /// the `@ExpoModule` macro binds. It is built in that runtime and cached by it.
  @JavaScriptActor
  func getJavaScriptValue(inAttachedRuntime runtime: JavaScriptRuntime) -> JavaScriptValue? {
    let moduleObjects = runtime.cached(moduleObjectsCacheKey) {
      return ModuleObjects()
    }
    // The registry can replace the module under the same name, so the cached object is only used for this holder.
    if let entry = moduleObjects.objects[name], entry.holderId == holderId {
      return entry.object.withUnwrappedValue { $0.asValue() }
    }
    do {
      let object = try createJavaScriptModuleObject(in: runtime)
      let value = object.asValue()
      moduleObjects.objects[name] = ModuleObjects.Entry(holderId: holderId, object: object.ref())
      return value
    } catch {
      log.error("Building the module object failed: \(error)")
      return nil
    }
  }

  /// Calls the listeners of the event with the payload and the module object as `this`. A module without a module
  /// object has no listeners, so the object isn't built for the event.
  @JavaScriptActor
  func dispatchEvent(event: String, payload: borrowing JavaScriptValue, in runtime: JavaScriptRuntime) {
    guard let eventListeners = eventEmitterState?.listeners(in: runtime)?.listeners(of: event) else {
      return
    }
    EventListeners.call(eventListeners, this: javaScriptObject!, payload: payload, in: runtime)
  }

  @JavaScriptActor
  func releaseJavaScriptObject() {
    // The native state keeps the listeners, values of the runtime that is going away. The module object can't use it
    // after that either.
    eventEmitterState?.removePrimaryListeners()
    eventEmitterState = nil
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

      // Install the `@SharedObject` classes the `@ExpoModule` macro registers by type.
      for classType in type(of: module)._classTypes {
        object.setProperty(classType._jsName, value: try appContext.getSharedObjectClass(classType))
      }

      // Install the `@JS` members the `@ExpoModule` macro binds directly into the JS object
      // (the direct-JSI path). A no-op for modules that don't use the macro.
      try module._decorateModule(object: object, in: appContext.runtime)

      installNativeViewComponents(on: object)

      let eventObservers =
        definition.eventObservers.isEmpty ? nil : EventObservers(definitions: definition.eventObservers)
      let eventEmitterState = ModuleEventEmitterNativeState(
        module: module,
        appContext: appContext,
        eventObservers: eventObservers,
        runtimeId: try appContext.runtime.id
      )
      object.setNativeState(eventEmitterState)
      self.eventEmitterState = eventEmitterState

      return object
    } catch {
      log.error("Building the module object failed: \(error)")
      return nil
    }
  }

  // MARK: Native view components

  /**
   The non-enumerable property of the module object that holds the component of the module's default view.
   It must stay in sync with `DEFAULT_VIEW_PROPERTY` in `NativeViewComponent.tsx`.
   */
  static let defaultViewPropertyName = "__expo_default_view__"

  /**
   Defines a lazy getter on the module object for each `@ExpoView` view. The first read creates the view's
   React component with `expo.__createNativeViewComponent` and replaces the getter with the component,
   so later reads don't call native. The default view is a separate component under the module's own component name.
   */
  @JavaScriptActor
  private func installNativeViewComponents(on object: borrowing JavaScriptObject) {
    for (viewName, viewType) in nativeViewTypes {
      let isDefaultView = viewName == DEFAULT_MODULE_VIEW
      let propertyName = isDefaultView ? ModuleHolder.defaultViewPropertyName : viewName

      if !isDefaultView && object.hasProperty(viewName) {
        log.error("The view '\(viewName)' isn't added to the module '\(name)', because the module already has a property with this name")
        continue
      }
      let config = NativeViewComponentConfig(
        viewType: viewType,
        componentName: ExpoFabricView.componentName(moduleName: name, viewName: viewName)
      )
      let options: JavaScriptObject.PropertyOptions = isDefaultView ? [.configurable] : [.configurable, .enumerable]
      object.defineLazyProperty(propertyName, options: options) { _, runtime in
        try NativeViewComponentFactory.create(config, in: runtime)
      }
    }
  }

  /// Creates the module object in a runtime other than the main runtime. The members of the `definition()` DSL
  /// are built in the main runtime only, so the object has only the `@JS` members.
  @JavaScriptActor
  private func createJavaScriptModuleObject(in runtime: JavaScriptRuntime) throws -> JavaScriptObject {
    let object = try runtime.global()
      .getPropertyAsObject(globalCoreObjectPropertyName)
      .getPropertyAsFunction("NativeModule")
      .callAsConstructor()
      .asObject()

    try module._decorateModule(object: object, in: runtime)

    // Give the module object a name like in the main runtime. It's used for compatibility reasons, see `EventEmitter.ts`.
    object.defineProperty("__expo_module_name__", value: name, options: [])
    return object
  }

  // MARK: Listening to native events

  func listeners(forEvent event: EventName) -> [EventListener] {
    return definition.eventListeners.filter {
      $0.name == event
    }
  }

  func post(event: EventName) {
    // The app lifecycle events come from `UIApplication`/`NSApplication` notifications on the main thread.
    nonisolated(unsafe) let module = module
    switch event {
    case .appEntersForeground:
      MainActor.assumeIsolated { module.appWillEnterForeground() }
    case .appBecomesActive:
      MainActor.assumeIsolated { module.appDidBecomeActive() }
    case .appEntersBackground:
      MainActor.assumeIsolated { module.appDidEnterBackground() }
    default:
      break
    }
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

/// The native state of a module object in the main runtime. Instead of the observing functions of the JS object, it
/// calls the listening hooks of the module, `didStartListening(event:)` and `didStopListening(event:)`, and the
/// `OnStartObserving` and `OnStopObserving` definitions.
internal final class ModuleEventEmitterNativeState: EventEmitterNativeState, @unchecked Sendable {
  private weak var module: AnyModule?
  private weak var appContext: AppContext?
  private let eventObservers: EventObservers?

  init(module: AnyModule, appContext: AppContext, eventObservers: EventObservers?, runtimeId: JavaScriptRuntime.ID) {
    self.module = module
    self.appContext = appContext
    self.eventObservers = eventObservers
    super.init(primaryRuntimeId: runtimeId)
  }

  @JavaScriptActor
  override func listeningDidChange(
    _ emitter: borrowing JavaScriptObject,
    event: String,
    eventValue: borrowing JavaScriptUnownedValue,
    isListening: Bool,
    in runtime: JavaScriptRuntime
  ) {
    if isListening {
      module?.didStartListening(event: event)
    } else {
      module?.didStopListening(event: event)
    }
    guard let eventObservers, let appContext else {
      return
    }
    if isListening {
      eventObservers.didStartListening(event: event, appContext: appContext)
    } else {
      eventObservers.didStopListening(event: event, appContext: appContext)
    }
  }
}

/// The module objects that a runtime other than the main runtime caches, by module name.
private final class ModuleObjects {
  struct Entry {
    /// The ID of the holder that the object was built for.
    let holderId: UInt64
    /// The module object.
    let object: JavaScriptObject.Ref
  }

  var objects: [String: Entry] = [:]
}

private let moduleObjectsCacheKey = JavaScriptRuntime.Cache.Key<ModuleObjects>()
