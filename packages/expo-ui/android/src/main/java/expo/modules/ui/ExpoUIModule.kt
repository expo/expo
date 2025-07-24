package expo.modules.ui

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.ui.button.Button
import expo.modules.ui.menu.ContextMenu

class ExpoUIModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoUI")

    // Defines a single view for now – a single choice segmented control
    View(PickerView::class) {
      Events("onOptionSelected")
    }

    View(SwitchView::class) {
      Events("onValueChange")
    }

    View(Button::class) {
      Events("onButtonPressed")
    }

    View(SliderView::class) {
      Events("onValueChanged")
    }

    View(ShapeView::class)

    View(DateTimePickerView::class) {
      Events("onDateSelected")
    }

    View(ContextMenu::class) {
      Events(
        "onContextMenuButtonPressed",
        "onContextMenuPickerOptionSelected",
        "onContextMenuSwitchValueChanged",
        "onExpandedChanged"
      )
    }

    View(ProgressView::class)

    View(TextInputView::class) {
      Events("onValueChanged")
    }

    View(RowView::class)
    View(ColumnView::class)
    View(ContainerView::class)
    View(TextView::class)
  }
}
