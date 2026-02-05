@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.CircularWavyProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.LinearWavyProgressIndicator
import androidx.compose.material3.ProgressIndicatorDefaults
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

enum class ProgressVariant(val value: String) : Enumerable {
  CIRCULAR("circular"),
  LINEAR("linear"),
  CIRCULAR_WAVY("circularWavy"),
  LINEAR_WAVY("linearWavy")
}

class ProgressColors : Record {
  @Field
  val trackColor: Color? = null
}

data class ProgressProps(
  val variant: ProgressVariant = ProgressVariant.CIRCULAR,
  val progress: Float? = null,
  val color: Color? = null,
  val elementColors: ProgressColors = ProgressColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.ProgressContent(props: ProgressProps) {
  val progress = props.progress
  val color = props.color
  val colors = props.elementColors
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)

  when (props.variant) {
    ProgressVariant.LINEAR -> {
      val composeColor = color.composeOrNull ?: ProgressIndicatorDefaults.linearColor
      val trackColor = colors.trackColor.composeOrNull ?: ProgressIndicatorDefaults.linearTrackColor
      if (progress != null) {
        LinearProgressIndicator(
          progress = { progress },
          color = composeColor,
          trackColor = trackColor,
          drawStopIndicator = {},
          modifier = modifier
        )
      } else {
        LinearProgressIndicator(
          color = composeColor,
          trackColor = trackColor,
          modifier = modifier
        )
      }
    }
    ProgressVariant.CIRCULAR -> {
      val composeColor = color.composeOrNull ?: ProgressIndicatorDefaults.circularColor
      if (progress != null) {
        CircularProgressIndicator(
          progress = { progress },
          color = composeColor,
          trackColor = colors.trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularDeterminateTrackColor,
          modifier = modifier
        )
      } else {
        CircularProgressIndicator(
          color = composeColor,
          trackColor = colors.trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularIndeterminateTrackColor,
          modifier = modifier
        )
      }
    }
    ProgressVariant.LINEAR_WAVY -> {
      val composeColor = color.composeOrNull ?: ProgressIndicatorDefaults.linearColor
      val trackColor = colors.trackColor.composeOrNull ?: ProgressIndicatorDefaults.linearTrackColor
      if (progress != null) {
        LinearWavyProgressIndicator(
          progress = { progress },
          color = composeColor,
          trackColor = trackColor,
          modifier = modifier
        )
      } else {
        LinearWavyProgressIndicator(
          color = composeColor,
          trackColor = trackColor,
          modifier = modifier
        )
      }
    }
    ProgressVariant.CIRCULAR_WAVY -> {
      val composeColor = color.composeOrNull ?: ProgressIndicatorDefaults.circularColor
      if (progress != null) {
        CircularWavyProgressIndicator(
          progress = { progress },
          color = composeColor,
          trackColor = colors.trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularDeterminateTrackColor,
          modifier = modifier
        )
      } else {
        CircularWavyProgressIndicator(
          color = composeColor,
          trackColor = colors.trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularDeterminateTrackColor,
          modifier = modifier
        )
      }
    }
  }
}
