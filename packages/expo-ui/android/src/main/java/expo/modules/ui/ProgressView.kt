package expo.modules.ui

import android.content.Context
import android.graphics.Color
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ProgressIndicatorDefaults
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.AutoSizingComposable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.Direction
import java.util.EnumSet

enum class ProgressVariant(val value: String) : Enumerable {
  CIRCULAR("circular"),
  LINEAR("linear"),
}

data class ProgressProps(
  val variant: MutableState<ProgressVariant> = mutableStateOf(ProgressVariant.CIRCULAR),
  val progress: MutableState<Float?> = mutableStateOf(null),
  val color: MutableState<Color?> = mutableStateOf(null),
  val trackColor: MutableState<Color?> = mutableStateOf(null),
) : ComposeProps

class ProgressView(context: Context, appContext: AppContext) : ExpoComposeView<ProgressProps>(context, appContext) {
  override val props = ProgressProps()

  init {
    setContent {
      val (variant) = props.variant
      val (progress) = props.progress
      val (color) = props.color
      val (trackColor) = props.trackColor
      DynamicTheme {
        when (variant) {
          ProgressVariant.LINEAR ->
            AutoSizingComposable(shadowNodeProxy, axis = EnumSet.of(Direction.VERTICAL)) {
              val composeColor = color.composeOrNull ?: ProgressIndicatorDefaults.linearColor
              val composeTrackColor = trackColor.composeOrNull ?: ProgressIndicatorDefaults.linearTrackColor
              if (progress != null) {
                LinearProgressIndicator(
                  progress = { progress },
                  color = composeColor,
                  trackColor = composeTrackColor,
                  drawStopIndicator = {},
                )
              } else {
                LinearProgressIndicator(color = composeColor, trackColor = composeTrackColor)
              }
            }
          ProgressVariant.CIRCULAR ->
            AutoSizingComposable(shadowNodeProxy) {
              val composeColor = color.composeOrNull ?: ProgressIndicatorDefaults.circularColor
              if (progress != null) {
                CircularProgressIndicator(
                  progress = { progress },
                  color = composeColor,
                  trackColor = trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularDeterminateTrackColor,
                )
              } else {
                CircularProgressIndicator(
                  color = composeColor,
                  trackColor = trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularIndeterminateTrackColor,
                )
              }
            }
        }
      }
    }
  }
}
