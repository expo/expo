import ExpoModulesCore
import ExpoUI

public class TestExpoUiModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TestExpoUi")

    OnCreate {
      ViewModifierRegistry.shared.register("customBorder") { params, appContext, _ in
        return try CustomBorderModifier(from: params, appContext: appContext)
      }
    }

    ExpoUIView(TestGroupView.self)
  }
}
