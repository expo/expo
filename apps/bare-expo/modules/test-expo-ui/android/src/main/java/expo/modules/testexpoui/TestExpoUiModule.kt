package expo.modules.testexpoui

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.recordFromMap
import expo.modules.ui.ExpoUIView
import expo.modules.ui.ModifierRegistry

class TestExpoUiModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TestExpoUi")

    OnCreate {
      ModifierRegistry.register("customBorder") { map, _, _, _ ->
        customBorderModifier(recordFromMap<CustomBorderParams>(map))
      }
    }

    OnDestroy {
      ModifierRegistry.unregister("customBorder")
    }

    ExpoUIView<MyCustomViewProps>("MyCustomView") {
      Content { props ->
        MyCustomViewContent(props)
      }
    }
  }
}
