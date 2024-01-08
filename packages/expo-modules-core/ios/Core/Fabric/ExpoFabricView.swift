// Copyright 2022-present 650 Industries. All rights reserved.

@objc(ExpoFabricView)
public class ExpoFabricView: ExpoFabricViewObjC {
  /**
   A weak reference to the app context associated with this view.
   The app context is injected into the class when making its copy in runtime,
   see the `makeClass` static function.
   */
  weak var appContext: AppContext? { __injectedAppContext() }

  /**
   Name of the module associated with this view. Injected by `makeClass` static function.
   */
  lazy var moduleName: String = __injectedModuleName()

  /**
   Returns a holder of the module associated with this view.
   */
  private var moduleHolder: ModuleHolder? {
    return appContext?.moduleRegistry.get(moduleHolderForName: moduleName)
  }


  /**
   A dictionary of prop objects that contain prop setters.
   */
  lazy var viewManagerPropDict: [String: AnyViewProp]? = moduleHolder?.viewManager?.propsDict()

  // MARK: - Initializers

  /**
   The default initializer for all native views. It is called by Fabric.
   */
  @objc
  public init() {
    super.init(frame: .zero)
    initializeContentView()
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // MARK: - ExpoFabricViewInterface

  public override func updateProps(_ props: [String: Any]) {
    guard let view = contentView, let context = appContext, let propsDict = viewManagerPropDict else {
      return
    }
    for (key, prop) in propsDict {
      let newValue = props[key] as Any

      // TODO: @tsapeta: Figure out better way to rethrow errors from here.
      // Adding `throws` keyword to the function results in different
      // method signature in Objective-C. Maybe just call `RCTLogError`?
      try? prop.set(value: Conversions.fromNSObject(newValue), onView: view, appContext: context)
    }
  }

  /**
   Calls lifecycle methods registered by `OnViewDidUpdateProps` definition component.
   */
  public override func viewDidUpdateProps() {
    guard let view = contentView, let viewManager = moduleHolder?.definition.viewManager else {
      return
    }
    viewManager.callLifecycleMethods(withType: .didUpdateProps, forView: view)
  }

  /**
   Returns a bool value whether the view supports prop with the given name.
   */
  public override func supportsProp(withName name: String) -> Bool {
    return viewManagerPropDict?.index(forKey: name) != nil
  }

  /**
   The function that is called by Fabric when the view is unmounted and is being enqueued for recycling.
   It can also be called on app reload, so be careful to wipe out any dependencies specific to the currently running AppContext.
   */
  public override func prepareForRecycle() {
    super.prepareForRecycle()

    // Unmount the proper view
    contentView = nil
  }

  /**
   An integer that is used to identify `UIView` objects.
   Fabric sets this property to the corresponding React tag
   when the view is mounted or `0` when it's enqueued for recycling.
   */
  public override var tag: Int {
    didSet {
      // The content view needs to be recreated when
      // the recycled view is about to be mounted again.
      if tag != 0 && contentView == nil {
        initializeContentView()
      }
    }
  }

  // MARK: - Privates

  /**
   Creates the content view using the associated view module.
   */
  private func initializeContentView() {
    guard let appContext = appContext else {
      fatalError(Exceptions.AppContextLost().reason)
    }
    guard let view = moduleHolder?.definition.viewManager?.createView(appContext: appContext) else {
      fatalError("Cannot create a view from module '\(moduleName)'")
    }
    // Setting the content view automatically adds the view as a subview.
    contentView = view
    installEventDispatchers()
  }

  /**
   Installs convenient event dispatchers for declared events, so the view can just invoke the block to dispatch the proper event.
   */
  private func installEventDispatchers() {
    guard let view = contentView, let moduleHolder = moduleHolder else {
      return
    }
    moduleHolder.viewManager?.eventNames.forEach { eventName in
      installEventDispatcher(forEvent: eventName, onView: view) { [weak self] (body: [String: Any]) in
        if let self = self {
          self.dispatchEvent(eventName, payload: body)
        } else {
          log.error("Cannot dispatch an event while the managing ExpoFabricView is deallocated")
        }
      }
    }
  }

  // MARK: - Statics

  internal static var viewClassesRegistry = [String: AnyClass]()

  /**
   Dynamically creates a subclass of the `ExpoFabricView` class with injected app context and name of the associated module.
   The new subclass is saved in the registry, so when asked for the next time, it's returned from cache with the updated app context.
   - Note: Apple's documentation says that classes created with `objc_allocateClassPair` should then be registered using `objc_registerClassPair`,
   but we can't do that as there might be more than one class with the same name (Expo Go) and allocating another one would return `nil`.
   */
  @objc
  public static func makeViewClass(forAppContext appContext: AppContext, className: String) -> AnyClass? {
    if let viewClass = viewClassesRegistry[className] {
      // When requested for a new class, make sure to update the injected app context.
      // We assume that the module name doesn't change, since it's based on the class name.
      inject(appContext: appContext, toViewClass: viewClass)
      return viewClass
    }
    guard let viewClass = objc_allocateClassPair(ExpoFabricView.self, className, 0) else {
      fatalError("Cannot allocate a Fabric view class for '\(className)'")
    }

    inject(appContext: appContext, toViewClass: viewClass)

    let moduleName = String(className.dropFirst(ViewModuleWrapper.viewManagerAdapterPrefix.count))
    inject(moduleName: moduleName, toViewClass: viewClass)

    // Save the allocated view class in the registry for the later use (e.g. when the app is reloaded).
    viewClassesRegistry[className] = viewClass

    return viewClass
  }

  internal static func inject(appContext: AppContext, toViewClass viewClass: AnyClass) {
    // Keep it weak so we don't leak the app context.
    weak var weakAppContext = appContext
    let appContextBlock: @convention(block) () -> AppContext? = { weakAppContext }
    let appContextBlockImp: IMP = imp_implementationWithBlock(appContextBlock)
    class_replaceMethod(viewClass, #selector(__injectedAppContext), appContextBlockImp, "@@:")
  }

  internal static func inject(moduleName: String, toViewClass viewClass: AnyClass) {
    let moduleNameBlock: @convention(block) () -> String = { moduleName }
    let moduleNameBlockImp: IMP = imp_implementationWithBlock(moduleNameBlock)
    class_replaceMethod(viewClass, #selector(__injectedModuleName), moduleNameBlockImp, "@@:")
  }
}
