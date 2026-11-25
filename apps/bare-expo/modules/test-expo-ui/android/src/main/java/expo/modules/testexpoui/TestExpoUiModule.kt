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
      ModifierRegistry.register("customBorder") { map, _, converterContext, _ ->
        customBorderModifier(recordFromMap<CustomBorderParams>(map, converterContext))
      }
    }

    OnDestroy {
      ModifierRegistry.unregister("customBorder")
    }

    ExpoUIView<MyCustomViewProps>("MyCustomView") {
      val onCustomTap by Event<Unit>()
      Content { props ->
        MyCustomViewContent(props) { onCustomTap(Unit) }
      }
    }
  }
}
