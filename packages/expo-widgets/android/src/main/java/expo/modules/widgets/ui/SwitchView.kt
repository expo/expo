package expo.modules.widgets.ui

import androidx.compose.runtime.Composable
import androidx.glance.appwidget.Switch
import androidx.glance.appwidget.SwitchDefaults
import expo.modules.ui.SwitchProps
import expo.modules.ui.colorToComposeColorOrNull
import androidx.glance.appwidget.SwitchColors

@Composable
fun SwitchView(props: SwitchProps) {
  Switch(
    checked = props.value,
    onCheckedChange = null,
    modifier = props.modifiers.toGlanceModifier(),
    colors = props.toGlanceSwitchColors()
  )
}

@Composable
private fun SwitchProps.toGlanceSwitchColors(): SwitchColors {
  val checkedThumbColor = colorToComposeColorOrNull(colors.checkedThumbColor)
  val uncheckedThumbColor = colorToComposeColorOrNull(colors.uncheckedThumbColor)
  val checkedTrackColor = colorToComposeColorOrNull(colors.checkedTrackColor)
  val uncheckedTrackColor = colorToComposeColorOrNull(colors.uncheckedTrackColor)

  return if (
    checkedThumbColor != null &&
    uncheckedThumbColor != null &&
    checkedTrackColor != null &&
    uncheckedTrackColor != null
  ) {
    SwitchDefaults.colors(
      checkedThumbColor = checkedThumbColor.toGlanceColorProvider(),
      uncheckedThumbColor = uncheckedThumbColor.toGlanceColorProvider(),
      checkedTrackColor = checkedTrackColor.toGlanceColorProvider(),
      uncheckedTrackColor = uncheckedTrackColor.toGlanceColorProvider()
    )
  } else {
    SwitchDefaults.colors()
  }
}
