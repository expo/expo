import ObjectiveC

/**
 A protocol that helps in identifying whether the instance of `ViewModuleWrapper` is of a dynamically created class.
 */
@objc
protocol DynamicModuleWrapperProtocol {
  @objc
  optional func wrappedModule() -> ViewModuleWrapper
}

/**
 Wrapper class that holds view module metadata and creates views.
 With Fabric, views are registered directly with RCTComponentViewFactory
 rather than through the legacy RCTViewManager bridge module system.
 */
@objc(EXViewModuleWrapper)
public final class ViewModuleWrapper: NSObject, DynamicModuleWrapperProtocol {
  /**
   A reference to the module holder that stores the module definition.
   */
  weak var moduleHolder: ModuleHolder?
  /**
   A reference to the module definition
   */
  var viewDefinition: AnyViewDefinition?

  /**
   A boolean indicating if the view manager represents the default module view – the first exported definition available without specifying a view name.
   */
  var isDefaultModuleView: Bool = true

  /**
   The designated initializer. At first, we use this base class to hide `ModuleHolder` from Objective-C runtime.
   */
  public init(_ moduleHolder: ModuleHolder, _ viewDefinition: AnyViewDefinition, isDefaultModuleView: Bool = false) {
    self.moduleHolder = moduleHolder
    self.viewDefinition = viewDefinition
    self.isDefaultModuleView = isDefaultModuleView
  }

  /**
   Default initializer required by NSObject and used by dynamic subclasses.
   When called on a dynamic subclass, retrieves the wrapped module reference.
   */
  @objc
  public override init() {
    super.init()
    guard let module = (self as DynamicModuleWrapperProtocol).wrappedModule?() else {
      return
    }
    self.moduleHolder = module.moduleHolder
    self.viewDefinition = moduleHolder?.definition.views[DEFAULT_MODULE_VIEW]
  }

  /**
   Dummy initializer, for use only in `EXModuleRegistryAdapter.extraModulesForModuleRegistry:`.
   */
  @objc
  public init(dummy: Any?) {
    super.init()
  }

  /**
   Returns the original name of the wrapped module.
   */
  @objc
  public func name() -> String {
    guard let moduleHolder, let viewDefinition else {
      fatalError("Failed to create ModuleHolder or a viewDefinition")
    }
    return self.isDefaultModuleView ? moduleHolder.name : "\(moduleHolder.name)_\(viewDefinition.name)"
  }

  /**
   Returns the original name of the wrapped module.
   */
  @objc
  public func moduleName() -> String {
    guard let moduleHolder else {
      fatalError("Failed to create ModuleHolder")
    }
    return moduleHolder.name
  }

  /**
   Returns the original name of the wrapped module.
   */
  @objc
  public func viewName() -> String {
    guard let viewDefinition else {
      fatalError("Failed to create ModuleHolder or a viewDefinition")
    }
    return self.isDefaultModuleView ? DEFAULT_MODULE_VIEW : viewDefinition.name
  }

  /**
   Static function that returns the class name, but keep in mind that dynamic wrappers
   have custom class name (see `objc_allocateClassPair` invocation in `createViewModuleWrapperClass`).
   */
  @objc
  public class func moduleName() -> String {
    return NSStringFromClass(Self.self)
  }

  /**
   The view manager wrapper doesn't require main queue setup — it doesn't call any UI-related stuff on `init`.
   Also, lazy-loaded modules must return false here.
   */
  @objc
  public class func requiresMainQueueSetup() -> Bool {
    return false
  }

  /**
   Creates a view from the wrapped module.
   */
  @objc
  public func view() -> UIView! {
    guard let appContext = moduleHolder?.appContext else {
      fatalError(Exceptions.AppContextLost().reason)
    }
    guard let view = try? viewDefinition?.createView(appContext: appContext)?.toUIView() else {
      fatalError("Cannot create a view '\(String(describing: viewDefinition?.name))' from module '\(String(describing: self.name))'")
    }
    return view
  }

  public static let viewManagerAdapterPrefix = "ViewManagerAdapter_"

  /**
   Creates a subclass of `ViewModuleWrapper` in runtime. The new class overrides `moduleName` stub.
   */
  @objc
  public static func createViewModuleWrapperClass(module: ViewModuleWrapper, appId: String?) -> ViewModuleWrapper.Type? {
    // We're namespacing the view name so we know it uses our architecture.
    let prefixedViewName = if let appId = appId {
      "\(viewManagerAdapterPrefix)\(module.name())_\((appId))"
    } else {
      "\(viewManagerAdapterPrefix)\(module.name())"
    }

    return prefixedViewName.withCString { viewNamePtr in
      // Create a new class that inherits from `ViewModuleWrapper`. The class name passed here, doesn't work for Swift classes,
      // so we also have to override `moduleName` class method.
      let wrapperClass: AnyClass? = objc_allocateClassPair(ViewModuleWrapper.self, viewNamePtr, 0)

      // Dynamically add instance method returning wrapped module to the dynamic wrapper class.
      // React Native initializes modules with `init` without params,
      // so there is no other way to pass it to the instances.
      let wrappedModuleBlock: @convention(block) () -> ViewModuleWrapper = { module }
      let wrappedModuleImp: IMP = imp_implementationWithBlock(wrappedModuleBlock)
      class_addMethod(wrapperClass, #selector(DynamicModuleWrapperProtocol.wrappedModule), wrappedModuleImp, "@@:")

      return wrapperClass as? ViewModuleWrapper.Type
    }
  }
}

// The direct event implementation can be cached and lazy-loaded (global and static variables are lazy by default in Swift).
nonisolated(unsafe) let directEventBlockImplementation = imp_implementationWithBlock({ ["RCTDirectEventBlock"] } as @convention(block) () -> [String])
