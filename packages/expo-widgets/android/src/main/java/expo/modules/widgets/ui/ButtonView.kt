package expo.modules.widgets.ui

import androidx.compose.runtime.Composable
import androidx.glance.Button
import androidx.glance.ButtonDefaults
import androidx.glance.unit.ColorProvider
import expo.modules.ui.button.ButtonProps as ExpoButtonProps
import expo.modules.ui.colorToComposeColorOrNull

typealias ButtonProps = ExpoButtonProps

@Composable
fun ButtonView(
  props: ButtonProps,
  text: String = ""
) {
  Button(
    text = text,
    onClick = {},
    modifier = props.modifiers.toGlanceModifier(),
    enabled = props.enabled,
    colors = props.toGlanceButtonColors()
  )
}

@Composable
private fun ButtonProps.toGlanceButtonColors(): androidx.glance.ButtonColors {
  val backgroundColor = colorToComposeColorOrNull(colors.containerColor)
  val contentColor = colorToComposeColorOrNull(colors.contentColor)

  return when {
    backgroundColor != null && contentColor != null -> ButtonDefaults.buttonColors(
      backgroundColor = ColorProvider(backgroundColor),
      contentColor = ColorProvider(contentColor)
    )
    backgroundColor != null -> ButtonDefaults.buttonColors(
      backgroundColor = ColorProvider(backgroundColor)
    )
    contentColor != null -> ButtonDefaults.buttonColors(
      contentColor = ColorProvider(contentColor)
    )
    else -> ButtonDefaults.buttonColors()
  }
}
