package expo.modules.widgets.ui

import androidx.compose.runtime.Composable
import androidx.glance.appwidget.CircularProgressIndicator
import androidx.glance.appwidget.LinearProgressIndicator
import androidx.glance.appwidget.ProgressIndicatorDefaults
import androidx.glance.unit.ColorProvider
import expo.modules.ui.CircularProgressIndicatorProps as ExpoCircularProgressIndicatorProps
import expo.modules.ui.LinearProgressIndicatorProps as ExpoLinearProgressIndicatorProps
import expo.modules.ui.LoadingIndicatorProps as ExpoLoadingIndicatorProps
import expo.modules.ui.colorToComposeColorOrNull

typealias LinearProgressIndicatorProps = ExpoLinearProgressIndicatorProps
typealias CircularProgressIndicatorProps = ExpoCircularProgressIndicatorProps
typealias LoadingIndicatorProps = ExpoLoadingIndicatorProps

@Composable
fun LinearProgressIndicatorView(props: LinearProgressIndicatorProps) {
  val modifier = props.modifiers.toGlanceModifier()
  val color = colorToComposeColorOrNull(props.color)
    ?.let(::ColorProvider)
    ?: ProgressIndicatorDefaults.IndicatorColorProvider
  val trackColor = colorToComposeColorOrNull(props.trackColor)
    ?.let(::ColorProvider)
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
      ?.let(::ColorProvider)
      ?: ProgressIndicatorDefaults.IndicatorColorProvider
  )
}

@Composable
fun LoadingIndicatorView(props: LoadingIndicatorProps) {
  CircularProgressIndicator(
    modifier = props.modifiers.toGlanceModifier(),
    color = colorToComposeColorOrNull(props.color)
      ?.let(::ColorProvider)
      ?: ProgressIndicatorDefaults.IndicatorColorProvider
  )
}
