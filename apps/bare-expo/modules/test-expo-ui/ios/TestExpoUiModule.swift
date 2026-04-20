import ExpoModulesCore
import ExpoUI

public class TestExpoUiModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TestExpoUi")

    OnCreate {
      ViewModifierRegistry.register("customBorder") { params, appContext, _ in
        return try CustomBorderModifier(from: params, appContext: appContext)
      }
    }

    OnDestroy {
      ViewModifierRegistry.unregister("customBorder")
    }

    ExpoUIView(MyCustomView.self)
  }
}
