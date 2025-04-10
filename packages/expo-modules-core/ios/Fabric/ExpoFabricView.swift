// Copyright 2022-present 650 Industries. All rights reserved.

#if RCT_NEW_ARCH_ENABLED

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

  public override func updateProps(_ props: [String: Any]) {
    guard let context = appContext, let propsDict = viewManagerPropDict else {
      return
    }
    for (key, prop) in propsDict {
      let newValue = props[key] as Any

      // TODO: @tsapeta: Figure out better way to rethrow errors from here.
      // Adding `throws` keyword to the function results in different
      // method signature in Objective-C. Maybe just call `RCTLogError`?
      try? prop.set(value: Conversions.fromNSObject(newValue), onView: self, appContext: context)
    }
  }

  /**
   Calls lifecycle methods registered by `OnViewDidUpdateProps` definition component.
   */
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
  public override func supportsProp(withName name: String) -> Bool {
    return viewManagerPropDict?.index(forKey: name) != nil
  }

  // MARK: - Privates

  /**
   Installs convenient event dispatchers for declared events, so the view can just invoke the block to dispatch the proper event.
   */
  private func installEventDispatchers() {
    viewDefinition?.eventNames.forEach { eventName in
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
      return viewClass
    }
    guard let viewClass = objc_allocateClassPair(ExpoFabricView.self, className, 0) else {
      fatalError("Cannot allocate a Fabric view class for '\(className)'")
    }
    inject(appContext: appContext)
    injectInitializer(appContext: appContext, moduleName: moduleName, viewName: viewName, toViewClass: viewClass)

    // Save the allocated view class in the registry for the later use (e.g. when the app is reloaded).
    viewClassesRegistry[className] = viewClass

    return viewClass
  }

  internal static func inject(appContext: AppContext) {
    // Keep it weak so we don't leak the app context.
    weak var weakAppContext = appContext
    let appContextBlock: @convention(block) () -> AppContext? = { weakAppContext }
    let appContextBlockImp: IMP = imp_implementationWithBlock(appContextBlock)
    class_replaceMethod(object_getClass(ExpoFabricView.self), #selector(appContextFromClass), appContextBlockImp, "@@:")
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

#endif // RCT_NEW_ARCH_ENABLED
