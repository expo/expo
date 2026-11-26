import ExpoModulesCore
import ExpoUI

public class TestExpoUiModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TestExpoUi")

    OnCreate {
      ViewModifierRegistry.register("customBorder", CustomBorderModifier.self)
    }

    OnDestroy {
      ViewModifierRegistry.unregister("customBorder")
    }

    ExpoUIView(MyCustomView.self)
  }
}
