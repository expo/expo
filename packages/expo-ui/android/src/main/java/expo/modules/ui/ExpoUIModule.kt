package expo.modules.ui

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoUIModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoUI")

    // Defines a single view for now – a single choice segmented control
    View(SingleChoiceSegmentedControlView::class) {
      Events("onOptionSelected")
    }
    View(SliderView::class) {
      Events("onValueChanged")
    }
  }
}
