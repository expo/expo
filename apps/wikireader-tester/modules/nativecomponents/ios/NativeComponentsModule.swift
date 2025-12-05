import React
import ExpoModulesCore

public final class NativeComponentsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeComponentsModule")

    View(MyItemList.self)
  }
}
