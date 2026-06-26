package expo.modules.widgets.ui

import androidx.compose.runtime.Composable
import androidx.glance.appwidget.CheckBox
import androidx.glance.appwidget.CheckboxDefaults
import androidx.glance.appwidget.CheckBoxColors
import expo.modules.ui.CheckboxProps
import expo.modules.ui.colorToComposeColorOrNull

@Composable
fun CheckboxView(props: CheckboxProps) {
  CheckBox(
    checked = props.value,
    onCheckedChange = null,
    modifier = props.modifiers.toGlanceModifier(),
    colors = props.toGlanceCheckboxColors()
  )
}

@Composable
private fun CheckboxProps.toGlanceCheckboxColors(): CheckBoxColors {
  val checkedColor = colorToComposeColorOrNull(colors.checkedColor)
  val uncheckedColor = colorToComposeColorOrNull(colors.uncheckedColor)

  return if (checkedColor != null && uncheckedColor != null) {
    CheckboxDefaults.colors(
      checkedColor = checkedColor.toGlanceColorProvider(),
      uncheckedColor = uncheckedColor.toGlanceColorProvider()
    )
  } else {
    CheckboxDefaults.colors()
  }
}
