package expo.modules.ui

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoUIModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoUI")

    // Defines a single view for now – a single choice segmented control
    View(SingleChoiceSegmentedControlView::class) {
      ComposeProp("options", Array<String>::class)
      ComposeProp("selectedIndex", Int::class)

      Events("onOptionSelected")
    }
  }
}
