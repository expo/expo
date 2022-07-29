// Copyright 2022-present 650 Industries. All rights reserved.

@objc(ExpoFabricView)
public class ExpoFabricView: ExpoFabricEnabledBaseView {
  weak var appContext: AppContext? { __injectedAppContext() }
  lazy var moduleName: String = __injectedModuleName()
  lazy var moduleHolder: ModuleHolder? = appContext?.moduleRegistry.get(moduleHolderForName: moduleName)
  lazy var legacyViewManager = appContext?.legacyModuleRegistry?.getAllViewManagers()
                                 .filter { $0.viewName() == moduleName }.first
  lazy var viewManagerPropDict: [String: AnyViewProp]? = moduleHolder?.viewManager?.propsDict()

  @objc
  public init() {
    super.init(frame: .zero)

    guard let view = moduleHolder?.definition.viewManager?.createView() ?? legacyViewManager?.view() else {
      fatalError()
    }
    self.contentView = view
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // MARK: - Creating a class copy

  @objc
  public static func makeClassCopy(forAppContext appContext: AppContext, className: String) -> AnyClass? {
    return className.withCString { classNamePtr in
      guard let classCopy = objc_allocateClassPair(ExpoFabricView.self, classNamePtr, 0) else {
        return nil
      }
      let appContextBlock: @convention(block) () -> AppContext? = { appContext }
      let appContextBlockImp: IMP = imp_implementationWithBlock(appContextBlock)
      class_replaceMethod(classCopy, #selector(__injectedAppContext), appContextBlockImp, "@@:")

      let moduleName = String(className.dropFirst(ViewModuleWrapper.viewManagerAdapterPrefix.count))
      let moduleNameBlock: @convention(block) () -> String = { moduleName }
      let moduleNameBlockImp: IMP = imp_implementationWithBlock(moduleNameBlock)
      class_replaceMethod(classCopy, #selector(__injectedModuleName), moduleNameBlockImp, "@@:")

      objc_registerClassPair(classCopy)
      return classCopy
    }
  }

  // MARK - overrides for ExpoFabricEnabledBaseView

  override public func updateProp(_ propName: String, withValue value: Any) {
    guard let view = self.contentView else {
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
}
