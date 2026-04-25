@file:OptIn(ExperimentalMaterial3ExpressiveApi::class, ExperimentalMaterial3Api::class)

package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.CircularWavyProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.LinearWavyProgressIndicator
import androidx.compose.material3.ProgressIndicatorDefaults
import androidx.compose.material3.WavyProgressIndicatorDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps

// region LinearProgressIndicator

@OptimizedRecord
class DrawStopIndicatorConfig : Record {
  @Field val color: Color? = null
  @Field val strokeCap: String? = null
  @Field val stopSize: Float? = null
}

@OptimizedComposeProps
data class LinearProgressIndicatorProps(
  val progress: Float? = null,
  val color: Color? = null,
  val trackColor: Color? = null,
  val strokeCap: String? = null,
  val gapSize: Float? = null,
  val drawStopIndicator: DrawStopIndicatorConfig? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.LinearProgressIndicatorContent(props: LinearProgressIndicatorProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  val color = props.color.composeOrNull ?: ProgressIndicatorDefaults.linearColor
  val trackColor = props.trackColor.composeOrNull ?: ProgressIndicatorDefaults.linearTrackColor
  val strokeCap = props.strokeCap.toStrokeCap() ?: ProgressIndicatorDefaults.LinearStrokeCap
  val gapSize = props.gapSize?.dp ?: ProgressIndicatorDefaults.LinearIndicatorTrackGapSize

  if (props.progress != null) {
    val stopIndicatorConfig = props.drawStopIndicator
    if (stopIndicatorConfig != null) {
      LinearProgressIndicator(
        progress = { props.progress },
        color = color,
        trackColor = trackColor,
        strokeCap = strokeCap,
        gapSize = gapSize,
        drawStopIndicator = {
          ProgressIndicatorDefaults.drawStopIndicator(
            drawScope = this,
            stopSize = stopIndicatorConfig.stopSize?.dp ?: ProgressIndicatorDefaults.LinearTrackStopIndicatorSize,
            color = stopIndicatorConfig.color.composeOrNull ?: color,
            strokeCap = stopIndicatorConfig.strokeCap.toStrokeCap() ?: strokeCap
          )
        },
        modifier = modifier
      )
    } else {
      LinearProgressIndicator(
        progress = { props.progress },
        color = color,
        trackColor = trackColor,
        strokeCap = strokeCap,
        gapSize = gapSize,
        modifier = modifier
      )
    }
  } else {
    LinearProgressIndicator(
      color = color,
      trackColor = trackColor,
      strokeCap = strokeCap,
      gapSize = gapSize,
      modifier = modifier
    )
  }
}

// endregion

// region CircularProgressIndicator

@OptimizedComposeProps
data class CircularProgressIndicatorProps(
  val progress: Float? = null,
  val color: Color? = null,
  val trackColor: Color? = null,
  val strokeWidth: Float? = null,
  val strokeCap: String? = null,
  val gapSize: Float? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.CircularProgressIndicatorContent(props: CircularProgressIndicatorProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  val color = props.color.composeOrNull ?: ProgressIndicatorDefaults.circularColor
  val strokeWidth = props.strokeWidth?.dp ?: ProgressIndicatorDefaults.CircularStrokeWidth

  if (props.progress != null) {
    val trackColor = props.trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularDeterminateTrackColor
    val strokeCap = props.strokeCap.toStrokeCap() ?: ProgressIndicatorDefaults.CircularDeterminateStrokeCap
    val gapSize = props.gapSize?.dp ?: ProgressIndicatorDefaults.CircularIndicatorTrackGapSize

    CircularProgressIndicator(
      progress = { props.progress },
      color = color,
      trackColor = trackColor,
      strokeWidth = strokeWidth,
      strokeCap = strokeCap,
      gapSize = gapSize,
      modifier = modifier
    )
  } else {
    val trackColor = props.trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularIndeterminateTrackColor
    val strokeCap = props.strokeCap.toStrokeCap() ?: ProgressIndicatorDefaults.CircularIndeterminateStrokeCap

    CircularProgressIndicator(
      color = color,
      trackColor = trackColor,
      strokeWidth = strokeWidth,
      strokeCap = strokeCap,
      modifier = modifier
    )
  }
}

// endregion

// region LinearWavyProgressIndicator

@OptimizedComposeProps
data class LinearWavyProgressIndicatorProps(
  val progress: Float? = null,
  val color: Color? = null,
  val trackColor: Color? = null,
  val stopSize: Float? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.LinearWavyProgressIndicatorContent(props: LinearWavyProgressIndicatorProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  val color = props.color.composeOrNull ?: WavyProgressIndicatorDefaults.indicatorColor
  val trackColor = props.trackColor.composeOrNull ?: WavyProgressIndicatorDefaults.trackColor
  val stopSize = props.stopSize?.dp ?: WavyProgressIndicatorDefaults.LinearTrackStopIndicatorSize

  if (props.progress != null) {
    LinearWavyProgressIndicator(
      progress = { props.progress },
      color = color,
      trackColor = trackColor,
      stopSize = stopSize,
      modifier = modifier
    )
  } else {
    LinearWavyProgressIndicator(
      color = color,
      trackColor = trackColor,
      modifier = modifier
    )
  }
}

// endregion

// region CircularWavyProgressIndicator

@OptimizedComposeProps
data class CircularWavyProgressIndicatorProps(
  val progress: Float? = null,
  val color: Color? = null,
  val trackColor: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.CircularWavyProgressIndicatorContent(props: CircularWavyProgressIndicatorProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  val color = props.color.composeOrNull ?: ProgressIndicatorDefaults.circularColor

  if (props.progress != null) {
    val trackColor = props.trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularDeterminateTrackColor

    CircularWavyProgressIndicator(
      progress = { props.progress },
      color = color,
      trackColor = trackColor,
      modifier = modifier
    )
  } else {
    val trackColor = props.trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularIndeterminateTrackColor

    CircularWavyProgressIndicator(
      color = color,
      trackColor = trackColor,
      modifier = modifier
    )
  }
}

// endregion

// Utility

private fun String?.toStrokeCap(): StrokeCap? {
  return when (this?.lowercase()) {
    "round" -> StrokeCap.Round
    "butt" -> StrokeCap.Butt
    "square" -> StrokeCap.Square
    else -> null
  }
}
