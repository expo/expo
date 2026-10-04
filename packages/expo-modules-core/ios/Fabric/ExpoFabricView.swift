// Copyright 2022-present 650 Industries. All rights reserved.

@objc(ExpoFabricView)
open class ExpoFabricView: ExpoFabricViewObjC, AnyExpoView {
  /**
   A weak reference to the app context associated with this view.
   It's passed to the initializer by the view definition, see `createComponentView`.
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
    // Component views are created by `createComponentView` through `+new` instead.
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

   NOTE: `ViewManagerAdapter_ExpoImage.new()` creates `ImageView` through `createComponentView`,
   and we also need viewDefinition (or moduleName) for the `installEventDispatchers()`.
   The example call flow would be:
   `ViewManagerAdapter_ExpoImage.new()` -> `ExpoFabricView.createComponentView()` -> `ViewDefinition.createView()` -> `ExpoFabricView.create()` ->
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
  public override func updateProps(_ props: [String: Any]) {
    guard let context = appContext, let propsDict = viewManagerPropDict else {
      return
    }
    for (key, prop) in propsDict {
      let newValue = props[key] as Any
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
  public override func supportsProp(withName name: String) -> Bool {
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

  /// Prefix of the component names. It tells apart the components backed by Expo modules.
  internal static let componentNamePrefix = "ViewManagerAdapter_"

  /**
   View classes registered in `RCTComponentViewFactory`, keyed by the component name.
   */
  @MainActor
  private static var viewClasses = [String: AnyClass]()

  /// Names of the module and the view that each class in `viewClasses` creates.
  @MainActor
  private static var componentsByViewClass = [ObjectIdentifier: (moduleName: String, viewName: String)]()

  /// Returns the name under which the view of the given module is registered in React Native.
  /// It must stay in sync with `requireNativeComponent` in `NativeViewManagerAdapter.native.tsx`.
  internal static func componentName(moduleName: String, viewName: String) -> String {
    if viewName == DEFAULT_MODULE_VIEW {
      return "\(componentNamePrefix)\(moduleName)"
    }
    return "\(componentNamePrefix)\(moduleName)_\(viewName)"
  }

  /// Registers the view of the given module in `RCTComponentViewFactory`. Each component is registered once per process,
  /// and the app context of each view is resolved when React Native creates it (see `createComponentView`).
  @MainActor
  internal static func registerComponent(moduleName: String, viewName: String) {
    if viewClasses[componentName(moduleName: moduleName, viewName: viewName)] != nil {
      return
    }
    ExpoFabricViewObjC.registerComponentViewClass(viewClass(moduleName: moduleName, viewName: viewName))
  }

  /// Returns a subclass of `ExpoFabricView` named after the component, creating it the first time it's requested.
  /// `RCTComponentViewFactory` maps each component to a class and creates views with `+[viewClass new]`, so every component
  /// needs a class of its own. The class doesn't add or replace any methods, it only identifies the component.
  @MainActor
  internal static func viewClass(moduleName: String, viewName: String) -> AnyClass {
    let className = componentName(moduleName: moduleName, viewName: viewName)

    if let viewClass = viewClasses[className] {
      return viewClass
    }
    guard let viewClass = objc_allocateClassPair(ExpoFabricView.self, className, 0) else {
      fatalError("Cannot allocate a Fabric view class for '\(className)' because a class with this name already exists")
    }
    objc_registerClassPair(viewClass)

    viewClasses[className] = viewClass
    componentsByViewClass[ObjectIdentifier(viewClass)] = (moduleName, viewName)
    return viewClass
  }

  /// Creates the view for the component that this class is registered for. It's called from `+new`, which is how
  /// `RCTComponentViewFactory` creates component views. The view is created by the module of the app context
  /// whose host is mounting. Returns `nil` for classes that aren't registered for any component.
  public override class func createComponentView() -> Any? {
    let view: AppleView? = MainActor.assumeIsolated {
      guard let (moduleName, viewName) = componentsByViewClass[ObjectIdentifier(self)] else {
        return nil
      }
      guard let appContext = AppContext.mountingAppContext else {
        fatalError(Exceptions.AppContextLost().reason)
      }
      guard let view = appContext.moduleRegistry.get(moduleHolderForName: moduleName)?.definition.views[viewName]?.createView(appContext: appContext) else {
        fatalError("Cannot create a view '\(viewName)' from module '\(moduleName)' because the module or its view isn't registered in the app context")
      }
      return view
    }
    switch view {
    case .uikit(let view):
      return view
    case .swiftui(let view):
      return view
    case nil:
      return nil
    }
  }
}
