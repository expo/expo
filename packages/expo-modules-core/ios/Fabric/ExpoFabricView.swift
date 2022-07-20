// Copyright 2022-present 650 Industries. All rights reserved.

@objc(ExpoFabricView)
public class ExpoFabricView: ExpoFabricEnabledBaseView {
  weak var appContext: AppContext? { __injectedAppContext() }
  lazy var moduleName: String = __injectedModuleName()
  lazy var moduleHolder: ModuleHolder? = appContext?.moduleRegistry.get(moduleHolderForName: "ExpoLinearGradient")

  @objc
  public init() {
    super.init(frame: .zero)

    guard let view = moduleHolder?.definition.viewManager?.createView() else {
      fatalError()
    }
    self.contentView = view
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // MARK: - Creating a class copy

  @objc
  public static func makeClassCopy(forAppContext appContext: AppContext, moduleName: String) -> AnyClass? {
    return moduleName.withCString { moduleNamePtr in
      guard let classCopy = objc_allocateClassPair(ExpoFabricView.self, moduleNamePtr, 0) else {
        return nil
      }
      let appContextBlock: @convention(block) () -> AppContext? = { appContext }
      let appContextBlockImp: IMP = imp_implementationWithBlock(appContextBlock)
      class_replaceMethod(classCopy, #selector(__injectedAppContext), appContextBlockImp, "@@:")

      let moduleNameBlock: @convention(block) () -> String = { moduleName }
      let moduleNameBlockImp: IMP = imp_implementationWithBlock(moduleNameBlock)
      class_replaceMethod(classCopy, #selector(__injectedModuleName), moduleNameBlockImp, "@@:")

      objc_registerClassPair(classCopy)
      return classCopy
    }
  }
}
