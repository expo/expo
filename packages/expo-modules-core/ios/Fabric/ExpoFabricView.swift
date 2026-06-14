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

  /// Prefix of the component names. It tells apart the components backed by Expo modules.
  internal static let componentNamePrefix = "ViewManagerAdapter_"

  /// View classes registered in `RCTComponentViewFactory`, keyed by the component name.
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
  internal static func registerComponent(moduleName: String, viewName: String, viewDefinition: AnyViewDefinition) {
    if let viewClass = viewClasses[componentName(moduleName: moduleName, viewName: viewName)] {
      if let component = componentsByViewClass[ObjectIdentifier(viewClass)], component != (moduleName, viewName) {
        log.error("The view '\(viewName)' from module '\(moduleName)' has the same component name as the view '\(component.viewName)' from module '\(component.moduleName)', so it's created by the module that registered it first")
      }
      return
    }
    let viewClass = viewClass(moduleName: moduleName, viewName: viewName)
    configurePropsDecoding(viewDefinition: viewDefinition, componentName: componentName(moduleName: moduleName, viewName: viewName), viewClass: viewClass)
    ExpoFabricViewObjC.registerComponentViewClass(viewClass)
  }

  /// Decides whether the props of the component are decoded on the JavaScript thread.
  ///
  /// The component class is only a shim around the concrete view (`createComponentView` returns an instance
  /// of the view the definition creates), so the capability is read from the definition's view type and stamped
  /// onto the shim as `+viewReceivesDecodedProps`. `+componentDescriptorProvider` reads that to pick the component
  /// descriptor, and the props dictionary is registered with the decoder only for components that opt in.
  /// It must run before the class is handed to `RCTComponentViewFactory`, which is what queries the descriptor.
  /// Like the class itself, the decision is made once per process by the app context that registers the component first.
  @MainActor
  internal static func configurePropsDecoding(viewDefinition: AnyViewDefinition, componentName: String, viewClass: AnyClass) {
    guard viewDefinition.receivesDecodedProps else {
      return
    }
    let decodesPropsBlock: @convention(block) () -> Bool = { true }
    let decodesPropsImp: IMP = imp_implementationWithBlock(decodesPropsBlock)
    class_replaceMethod(object_getClass(viewClass), #selector(ExpoFabricViewObjC.viewReceivesDecodedProps), decodesPropsImp, "B@:")

    ViewPropsJSIDecoder.register(propsDict: viewDefinition.propsDict(), forClassName: componentName)
  }

  /// Returns a subclass of `ExpoFabricView` named after the component, creating it the first time it's requested.
  /// `RCTComponentViewFactory` maps each component to a class and creates views with `+[viewClass new]`, so every component
  /// needs a class of its own. The class only identifies the component, apart from `+viewReceivesDecodedProps` (see `configurePropsDecoding`).
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
      guard let appContext = AppContext.appContextForNewViews else {
        fatalError(Exceptions.AppContextLost().reason)
      }
      guard let view = appContext.moduleRegistry.get(moduleHolderForName: moduleName)?.definition.views[viewName]?.createView(appContext: appContext) else {
        // Component classes are shared by all app contexts, so another app context might have registered this one.
        log.error("Cannot create a view '\(viewName)' from module '\(moduleName)' because the module or its view isn't registered in the app context, so an empty view is created instead")
        return .uikit(self.init(appContext: appContext))
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
