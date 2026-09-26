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
   and we also need viewDefinition (or moduleName) for the `installEventDispatchers()`.
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
      if !Conversions.areValuesEqual(previousValue, convertedNewValue) {
        // TODO: @tsapeta: Figure out better way to rethrow errors from here.
        // Adding `throws` keyword to the function results in different
        // method signature in Objective-C. Maybe just call `RCTLogError`?
        try? prop.set(value: convertedNewValue, onView: self, appContext: context)

        previousProps[key] = convertedNewValue
      }
    }
  }

  /// Whether this view applies props through `applyDecodedProps(_:)`, and can therefore have
  /// them decoded from their JavaScript values on the JavaScript thread instead of being lowered
  /// to a dictionary and decoded on the main thread.
  ///
  /// `false` by default: views built with the `Prop` definition DSL and SwiftUI hosting views apply
  /// props from the lowered dictionary (`updateProps(_:)` / `updateRawProps`), and that path is
  /// left untouched. A view class opts in by overriding this to `true`; it then receives its props
  /// only through `applyDecodedProps(_:)`, because the decoded props object skips the dictionary
  /// lowering entirely. The decision is read once per view class at component registration, so it
  /// must be a constant of the class, not of any instance.
  open class var receivesDecodedProps: Bool {
    return false
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

      if !Conversions.areValuesEqual(previousValue, value) {
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
   Calls lifecycle methods registered by `OnViewDidUpdateProps` definition component.
   */
  @MainActor
  public override func viewDidUpdateProps() {
    guard let viewDefinition else {
      return
    }
    guard let view = AppleView.from(self) else {
      return
    }
    viewDefinition.callLifecycleMethods(withType: .didUpdateProps, forView: view)
  }

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
      configurePropsDecoding(appContext: appContext, moduleName: moduleName, viewName: viewName, className: className, viewClass: viewClass)
      return viewClass
    }
    guard let viewClass = objc_allocateClassPair(ExpoFabricView.self, className, 0) else {
      fatalError("Cannot allocate a Fabric view class for '\(className)'")
    }
    inject(appContext: appContext)
    injectInitializer(appContext: appContext, moduleName: moduleName, viewName: viewName, toViewClass: viewClass)
    configurePropsDecoding(appContext: appContext, moduleName: moduleName, viewName: viewName, className: className, viewClass: viewClass)

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

  /// Decides, once per dynamic view class, whether its props are decoded on the JavaScript thread.
  ///
  /// The dynamic class is only a shim around the concrete view (`injectInitializer` makes its
  /// initializer return an instance of the view the definition creates), so the capability is read
  /// from the definition's view type and stamped onto the shim as `+viewReceivesDecodedProps`.
  /// `+componentDescriptorProvider` reads that to pick the component descriptor, and the props
  /// dictionary is registered with the decoder only for classes that opt in. Runs before the class
  /// is handed to `RCTComponentViewFactory`, which is what queries the descriptor. Best-effort:
  /// leaves the class on the dictionary path if the module or view definition can't be resolved.
  internal static func configurePropsDecoding(
    appContext: AppContext,
    moduleName: String,
    viewName: String,
    className: String,
    viewClass: AnyClass
  ) {
    let viewDefinition = appContext.moduleRegistry
      .get(moduleHolderForName: moduleName)?
      .definition
      .views[viewName]
    let decodesProps = viewDefinition?.receivesDecodedProps ?? false

    // Stamped on every registration (not only when `true`) so a reload that lands a different
    // definition under the same class name doesn't keep a stale answer.
    let decodesPropsBlock: @convention(block) () -> Bool = { decodesProps }
    let decodesPropsImp: IMP = imp_implementationWithBlock(decodesPropsBlock)
    class_replaceMethod(object_getClass(viewClass), #selector(ExpoFabricViewObjC.viewReceivesDecodedProps), decodesPropsImp, "B@:")

    guard decodesProps, let viewDefinition else {
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
