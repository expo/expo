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
   The view manager of the associated legacy module.
   Not available if the module is registered in the new module registry.
   */
  lazy var legacyViewManager = appContext?.legacyModuleRegistry?.getAllViewManagers()
                                 .filter { $0.viewName() == moduleName }
                                 .first

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

  public override func updateProp(_ propName: String, withValue value: Any) {
    guard let view = contentView else {
      return
    }
    if let _ = moduleHolder, let prop = viewManagerPropDict?[propName] {
      // TODO: @tsapeta: Figure out better way to rethrow errors from here.
      // Adding `throws` keyword to the function results in different
      // method signature in Objective-C. Maybe just call `RCTLogError`?
      try? prop.set(value: value, onView: view)
    } else if let _ = legacyViewManager {
      legacyViewManager?.updateProp(propName, withValue: value, on: view)
    }
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
    guard let view = moduleHolder?.definition.viewManager?.createView() ?? legacyViewManager?.view() else {
      fatalError()
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

  /**
   Dynamically creates a subclass of the `ExpoFabricView` class with injected app context and name of the associated module.
   - Note: Apple's documentation says that classes created with `objc_allocateClassPair` should then be registered using `objc_registerClassPair`,
   but we can't do that as there might be more than one class with the same name and allocating another one would return `nil`.
   */
  @objc
  public static func makeClass(forAppContext appContext: AppContext, className: String) -> AnyClass? {
    return className.withCString { classNamePtr in
      guard let classCopy = objc_allocateClassPair(ExpoFabricView.self, classNamePtr, 0) else {
        fatalError("Cannot allocate a Fabric view class for '\(className)'")
      }
      let appContextBlock: @convention(block) () -> AppContext? = { appContext }
      let appContextBlockImp: IMP = imp_implementationWithBlock(appContextBlock)
      class_replaceMethod(classCopy, #selector(__injectedAppContext), appContextBlockImp, "@@:")

      let moduleName = String(className.dropFirst(ViewModuleWrapper.viewManagerAdapterPrefix.count))
      let moduleNameBlock: @convention(block) () -> String = { moduleName }
      let moduleNameBlockImp: IMP = imp_implementationWithBlock(moduleNameBlock)
      class_replaceMethod(classCopy, #selector(__injectedModuleName), moduleNameBlockImp, "@@:")

      return classCopy
    }
  }
}
