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

    View(TextInputView::class)

    Class("StringValueBinding", ValueBinding::class) {
      Constructor { value: String ->
        ValueBinding(value)
      }
      Function("get") { binding: ValueBinding<String> ->
        binding.value.value
      }
      Function("set") { binding: ValueBinding<String>, value: String ->
        appContext.activityProvider?.currentActivity?.runOnUiThread {
          binding.value.value = value
        }
      }
    }
  }
}
