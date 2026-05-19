package expo.modules.widgets.ui

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.ui.ExpoUIView

class WidgetsUIModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoWidgetsUI")

    ExpoUIView<TextProps>("TextView") {
      Content { props ->
        TextView(props)
      }
    }
  }
}
