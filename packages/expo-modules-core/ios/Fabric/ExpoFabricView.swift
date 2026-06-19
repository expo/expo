// Copyright 2022-present 650 Industries. All rights reserved.

/// - Warning: The ObjC name `ExpoFabricView` and the selector
///   `makeViewClassForAppContext:moduleName:viewName:className:` are resolved at runtime via
///   `NSClassFromString` / `NSSelectorFromString` from `ExpoFabricViewObjC.mm`.
///   Renaming the class or that method will break those call sites silently at runtime.
@objc(ExpoFabricView)
open class ExpoFabricView: ExpoFabricViewObjC, AnyExpoView {
  /**
   A weak reference to the app context associated with this view.
   The app context is injected into the class after the context is initialized.
   see the `makeClass` static function.
   */
  public weak var appContext: AppContext?

  /**
   The view definition that setup from `ExpoFabricView.create()`.
   */
  private var viewDefinition: AnyViewDefinition?

  /**
   A dictionary of prop objects that contain prop setters.
   */
  lazy var viewManagerPropDict: [String: AnyViewProp]? = viewDefinition?.propsDict()

  /**
   A dictionary to store previous prop values for change detection.
   */
  private var previousProps: [String: Any] = [:]

  // MARK: - Initializers

  // swiftlint:disable unavailable_function
  @objc
  public init() {
    // For derived views, their initializer should be replaced by the 'class_replaceMethod'.
    fatalError("Unsupported direct init() call for ExpoFabricView.")
  }
  // swiftlint:enable unavailable_function

  @objc
  public override init(frame: CGRect) {
    super.init(frame: frame)
  }

  public func setViewSize(_ size: CGSize) {
    super.setShadowNodeSize(Float(size.width), height: Float(size.height))
  }

  required public init(appContext: AppContext? = nil) {
    self.appContext = appContext
    super.init(frame: .zero)
  }

  /**
   The view creator expected to be called for derived ExpoFabricView, the `viewDefinition` and event dispatchers will be setup from here.

   NOTE: We swizzle the initializers, e.g. `ViewManagerAdapter_ExpoImage.new()` to `ImageView.init(appContext:)`
   and we also need viewDefintion (or moduleName) for the `installEventDispatchers()`.
   Swizzling ExpoFabricView doesn't give us chance to inject iMethod or iVar of ImageView and pass the moduleName.
   Alternatively, we try to add a dedicated `ExpoFabricView.create()` and passing viewDefinition into the class.
   That's not a perfect implementation but turns out to be the only way to get the viewDefinition (or moduleName).
   The example call flow would be:
   `ViewManagerAdapter_ExpoImage.new()` -> `ViewDefinition.createView()` -> `ExpoFabricView.create()` ->
   `ImageView.init(appContext:)` -> `ExpoFabricView.init(appContext:)` -> `view.viewDefinition = viewDefinition` here
   */
  internal static func create(viewType: ExpoFabricView.Type, viewDefinition: AnyViewDefinition, appContext: AppContext) -> ExpoFabricView {
    let view = viewType.init(appContext: appContext)
    view.viewDefinition = viewDefinition
    assert(appContext == view.appContext)
    view.installEventDispatchers()
    return view
  }

  // Mark the required init as unavailable so that subclasses can avoid overriding it.
  @available(*, unavailable)
  public required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // MARK: - ExpoFabricViewInterface

  @MainActor
  open override func updateProps(_ props: [String: Any]) {
    guard let context = appContext, let propsDict = viewManagerPropDict else {
      return
    }
    // Iterate the props actually present in this update, not every declared prop. A removed prop
    // arrives as an explicit null value (a present key), so this still resets it; an absent key
    // carries no information and must not be treated as a change to nil.
    for (key, newValue) in props {
      guard let prop = propsDict[key] else {
        continue
      }
      let convertedNewValue = Conversions.fromNSObject(newValue)
      let previousValue = previousProps[key]

      // only set the prop if the value has changed
      if !areValuesEqual(previousValue, convertedNewValue) {
        // TODO: @tsapeta: Figure out better way to rethrow errors from here.
        // Adding `throws` keyword to the function results in different
        // method signature in Objective-C. Maybe just call `RCTLogError`?
        try? prop.set(value: convertedNewValue, onView: self, appContext: context)

        previousProps[key] = convertedNewValue
      }
    }
  }

  /**
   Applies view props that were decoded straight from their JavaScript values on the
   JavaScript thread (see the JSI view-props decoding design). The values are already in
   their native representation, so this only runs each prop's setter; no `cast` happens
   here. Decoded and undecoded props are disjoint, so any remaining props are applied
   separately by `updateProps(_:)`.
   */
  @MainActor
  @objc
  open override func applyDecodedProps(_ decodedProps: Any) {
    // Typed as `Any` to match the Objective-C `id` parameter (see `ExpoFabricViewObjC.h` for why
    // the header can't reference `EXDecodedViewProps` directly); always a `DecodedViewProps`.
    guard let decodedProps = decodedProps as? DecodedViewProps else {
      return
    }
    guard let context = appContext, let propsDict = viewManagerPropDict else {
      return
    }
    for (key, value) in decodedProps.values {
      guard let prop = propsDict[key] else {
        continue
      }
      let previousValue = previousProps[key]

      if !areValuesEqual(previousValue, value) {
        do {
          try prop.applyDecoded(value: value, onView: self, appContext: context)
          // Record as previous only on success, so a value that failed to apply is retried on the
          // next update rather than short-circuited by `areValuesEqual`.
          previousProps[key] = value
        } catch {
          // TODO: React Native's `convertRawProp` resets a prop to its default value when
          // conversion fails; here (and on the legacy `updateProps` path) we only log and leave
          // the prop at its previous value. This also covers prop *removal*: a removed prop arrives
          // as an explicit JS `null`, which resets an optional prop (via `Optional.isNil`) but makes
          // a non-optional prop's `cast` throw and land here, so it keeps its stale value instead of
          // resetting. Align both paths with RN's reset-to-default behavior, and add a
          // set-then-remove test on a non-optional prop.
          log.error("Applying decoded prop '\(key)' failed: \(error.localizedDescription)")
        }
      }
    }
  }

  /**
   Helper function to compare two values for equality using string representation.
   */
  private func areValuesEqual(_ lhs: Any?, _ rhs: Any?) -> Bool {
    switch (lhs, rhs) {
    case (nil, nil):
      return true
    case let (lhsValue as AnyHashable, rhsValue as AnyHashable):
      return lhsValue == rhsValue
    case let (lhsValue as NSObjectProtocol, rhsValue as NSObjectProtocol):
      return lhsValue.isEqual(rhsValue)
    default:
      return false
    }
  }
  /**
   Framework entry point called at the start of a props update (from `finalizeUpdates:`), before
   any prop is applied. `final` so its bookkeeping always runs; subclasses customize by overriding
   `viewWillUpdateProps()` instead, which doesn't need to call `super`.
   */
  @MainActor
  public final override func callViewWillUpdateLifecycleMethods() {
    viewWillUpdateProps()
  }

  /**
   Framework entry point called at the end of a props update (from `finalizeUpdates:`). `final` so
   the registered `OnViewDidUpdateProps` lifecycle methods always run; subclasses customize by
   overriding `viewDidUpdateProps()` instead, which doesn't need to call `super`.
   */
  @MainActor
  public final override func callViewDidUpdateLifecycleMethods() {
    viewDidUpdateProps()

    guard let viewDefinition else {
      return
    }
    guard let view = AppleView.from(self) else {
      return
    }
    viewDefinition.callLifecycleMethods(withType: .didUpdateProps, forView: view)
  }

  /**
   Called at the start of a props update, before any prop is applied. Pairs with
   `viewDidUpdateProps()` so subclasses can bracket the apply phase (e.g. for benchmarking).
   No-op by default; overrides don't need to call `super`.
   */
  @MainActor
  open func viewWillUpdateProps() {}

  /**
   Called at the end of a props update, after all props are applied. No-op by default; overrides
   don't need to call `super`.
   */
  @MainActor
  open func viewDidUpdateProps() {}

  /**
   Returns a bool value whether the view supports prop with the given name.
   */
  open override func supportsProp(withName name: String) -> Bool {
    return viewManagerPropDict?.index(forKey: name) != nil
  }

  // MARK: - Privates

  /**
   Installs convenient event dispatchers for declared events, so the view can just invoke the block to dispatch the proper event.
   */
  private func installEventDispatchers() {
    guard let viewDefinition else {
      return
    }
    viewDefinition.eventNames.forEach { eventName in
      installEventDispatcher(forEvent: eventName, onView: self) { [weak self] (body: [String: Any]) in
        if let self = self {
          self.dispatchEvent(eventName, payload: body)
        } else {
          log.error("Cannot dispatch an event while the managing ExpoFabricView is deallocated")
        }
      }
    }
  }

  // MARK: - Statics

  /**
   Called by React Native to check if the view supports recycling.
   */
  @objc
  public static func shouldBeRecycled() -> Bool {
    // Turn off recycling for Expo views. We don't think there is any benefit of recycling – it may lead to more bugs than gains.
    // TODO: Make it possible to override this behavior for particular views
    return false
  }

  internal static var viewClassesRegistry = [String: AnyClass]()

  /**
   Dynamically creates a subclass of the `ExpoFabricView` class with injected app context and name of the associated module.
   The new subclass is saved in the registry, so when asked for the next time, it's returned from cache with the updated app context.
   - Note: Apple's documentation says that classes created with `objc_allocateClassPair` should then be registered using `objc_registerClassPair`,
   but we can't do that as there might be more than one class with the same name (Expo Go) and allocating another one would return `nil`.
   */
  @objc
  public static func makeViewClass(forAppContext appContext: AppContext, moduleName: String, viewName: String, className: String) -> AnyClass? {
    if let viewClass = viewClassesRegistry[className] {
      inject(appContext: appContext)
      injectInitializer(appContext: appContext, moduleName: moduleName, viewName: viewName, toViewClass: viewClass)
      registerPropsDictForJSIDecoding(appContext: appContext, moduleName: moduleName, viewName: viewName, className: className)
      return viewClass
    }
    guard let viewClass = objc_allocateClassPair(ExpoFabricView.self, className, 0) else {
      fatalError("Cannot allocate a Fabric view class for '\(className)'")
    }
    inject(appContext: appContext)
    injectInitializer(appContext: appContext, moduleName: moduleName, viewName: viewName, toViewClass: viewClass)
    registerPropsDictForJSIDecoding(appContext: appContext, moduleName: moduleName, viewName: viewName, className: className)

    // Save the allocated view class in the registry for the later use (e.g. when the app is reloaded).
    viewClassesRegistry[className] = viewClass

    return viewClass
  }

  internal static func inject(appContext: AppContext) {
    // Keep it weak so we don't leak the app context. We use `var` because `let` is only supported in Swift 6.0+
    weak var weakAppContext = appContext
    let appContextBlock: @convention(block) () -> AppContext? = { weakAppContext }
    let appContextBlockImp: IMP = imp_implementationWithBlock(appContextBlock)
    class_replaceMethod(object_getClass(ExpoFabricView.self), #selector(appContextFromClass), appContextBlockImp, "@@:")
  }

  /**
   Resolves the prop definitions for the given module/view and caches them under the dynamic
   view class name, so JSI view-props decoding can look them up at Fabric props-parse time
   (before any view instance exists). Best-effort: silently does nothing if the module or
   view definition can't be resolved.
   */
  internal static func registerPropsDictForJSIDecoding(appContext: AppContext, moduleName: String, viewName: String, className: String) {
    guard let moduleHolder = appContext.moduleRegistry.get(moduleHolderForName: moduleName),
          let viewDefinition = moduleHolder.definition.views[viewName] else {
      return
    }
    // SwiftUI views apply props from the lowered dictionary (`updateRawProps`), not from the
    // JS-thread-decoded values, so they stay on the legacy path and aren't registered here.
    guard !viewDefinition.isSwiftUI else {
      return
    }
    ViewPropsJSIDecoder.register(propsDict: viewDefinition.propsDict(), forClassName: className)
  }

  internal static func injectInitializer(appContext: AppContext, moduleName: String, viewName: String, toViewClass viewClass: AnyClass) {
    // The default initializer for native views. It will be called by Fabric.
    let newBlock: @convention(block) () -> Any = {[weak appContext] in
      guard let appContext, let moduleHolder = appContext.moduleRegistry.get(moduleHolderForName: moduleName) else {
        fatalError(Exceptions.AppContextLost().reason)
      }
      guard let view = moduleHolder.definition.views[viewName]?.createView(appContext: appContext) else {
        fatalError("Cannot create a view '\(viewName)' from module '\(moduleName)'")
      }
      switch view {
      case .uikit(let view):
        _ = Unmanaged.passRetained(view) // retain the view given this is an initializer
        return view
      case .swiftui(let view):
        if let viewObject = view as AnyObject? {
          _ = Unmanaged.passRetained(viewObject) // retain the view given this is an initializer
        }
        return view
      }
    }
    let newBlockImp: IMP = imp_implementationWithBlock(newBlock)
    class_replaceMethod(object_getClass(viewClass), Selector("new"), newBlockImp, "@@:")
  }

  // swiftlint:disable unavailable_function
  @objc
  private dynamic static func appContextFromClass() -> AppContext? {
    fatalError("The AppContext must be injected in the 'ExpoFabricView' class")
  }
  // swiftlint:enable unavailable_function
}
