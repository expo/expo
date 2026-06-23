package expo.modules.widgets.ui

import androidx.compose.runtime.Composable
import androidx.glance.GlanceTheme
import androidx.glance.appwidget.Switch
import androidx.glance.appwidget.SwitchColors
import androidx.glance.appwidget.SwitchDefaults
import expo.modules.ui.SwitchProps
import expo.modules.ui.colorToComposeColorOrNull

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
  val checkedThumbColor =
    colorToComposeColorOrNull(colors.checkedThumbColor)?.toGlanceColorProvider()
  val uncheckedThumbColor =
    colorToComposeColorOrNull(colors.uncheckedThumbColor)?.toGlanceColorProvider()
  val checkedTrackColor =
    colorToComposeColorOrNull(colors.checkedTrackColor)?.toGlanceColorProvider()
  val uncheckedTrackColor =
    colorToComposeColorOrNull(colors.uncheckedTrackColor)?.toGlanceColorProvider()

  return SwitchDefaults.colors(
    checkedThumbColor = checkedThumbColor ?: GlanceTheme.colors.onPrimary,
    uncheckedThumbColor = uncheckedThumbColor ?: GlanceTheme.colors.outline,
    checkedTrackColor = checkedTrackColor ?: GlanceTheme.colors.primary,
    uncheckedTrackColor = uncheckedTrackColor ?: GlanceTheme.colors.surfaceVariant
  )
}
