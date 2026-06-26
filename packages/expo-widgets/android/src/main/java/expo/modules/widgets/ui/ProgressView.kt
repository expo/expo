package expo.modules.widgets.ui

import androidx.compose.runtime.Composable
import androidx.glance.appwidget.CircularProgressIndicator
import androidx.glance.appwidget.LinearProgressIndicator
import androidx.glance.appwidget.ProgressIndicatorDefaults
import expo.modules.ui.CircularProgressIndicatorProps
import expo.modules.ui.LinearProgressIndicatorProps
import expo.modules.ui.LoadingIndicatorProps
import expo.modules.ui.colorToComposeColorOrNull

@Composable
fun LinearProgressIndicatorView(props: LinearProgressIndicatorProps) {
  val modifier = props.modifiers.toGlanceModifier()
  val color = colorToComposeColorOrNull(props.color)
    ?.toGlanceColorProvider()
    ?: ProgressIndicatorDefaults.IndicatorColorProvider
  val trackColor = colorToComposeColorOrNull(props.trackColor)
    ?.toGlanceColorProvider()
    ?: ProgressIndicatorDefaults.BackgroundColorProvider

  val progress = props.progress
  if (progress != null) {
    LinearProgressIndicator(
      progress = progress,
      modifier = modifier,
      color = color,
      backgroundColor = trackColor
    )
  } else {
    LinearProgressIndicator(
      modifier = modifier,
      color = color,
      backgroundColor = trackColor
    )
  }
}

@Composable
fun CircularProgressIndicatorView(props: CircularProgressIndicatorProps) {
  CircularProgressIndicator(
    modifier = props.modifiers.toGlanceModifier(),
    color = colorToComposeColorOrNull(props.color)
      ?.toGlanceColorProvider()
      ?: ProgressIndicatorDefaults.IndicatorColorProvider
  )
}

@Composable
fun LoadingIndicatorView(props: LoadingIndicatorProps) {
  CircularProgressIndicator(
    modifier = props.modifiers.toGlanceModifier(),
    color = colorToComposeColorOrNull(props.color)
      ?.toGlanceColorProvider()
      ?: ProgressIndicatorDefaults.IndicatorColorProvider
  )
}
