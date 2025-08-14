package expo.modules.ui

import android.content.Context
import android.graphics.Color
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ProgressIndicatorDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.AutoSizingComposable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.Direction
import java.util.EnumSet

enum class ProgressVariant(val value: String) : Enumerable {
  CIRCULAR("circular"),
  LINEAR("linear")
}

class ProgressColors : Record {
  @Field
  val trackColor: Color? = null
}

data class ProgressProps(
  val variant: MutableState<ProgressVariant> = mutableStateOf(ProgressVariant.CIRCULAR),
  val progress: MutableState<Float?> = mutableStateOf(null),
  val color: MutableState<Color?> = mutableStateOf(null),
  val elementColors: MutableState<ProgressColors> = mutableStateOf(ProgressColors()),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

class ProgressView(context: Context, appContext: AppContext) :
  ExpoComposeView<ProgressProps>(context, appContext, withHostingView = true) {
  override val props = ProgressProps()

  @Composable
  override fun Content(modifier: Modifier) {
    val (variant) = props.variant
    val (progress) = props.progress
    val (color) = props.color
    val (colors) = props.elementColors
    DynamicTheme {
      when (variant) {
        ProgressVariant.LINEAR ->
          AutoSizingComposable(shadowNodeProxy, axis = EnumSet.of(Direction.VERTICAL)) {
            val composeColor = color.composeOrNull ?: ProgressIndicatorDefaults.linearColor
            val trackColor = colors.trackColor.composeOrNull ?: ProgressIndicatorDefaults.linearTrackColor
            if (progress != null) {
              LinearProgressIndicator(
                progress = { progress },
                color = composeColor,
                trackColor = trackColor,
                drawStopIndicator = {},
                modifier = Modifier.fromExpoModifiers(props.modifiers.value)
              )
            } else {
              LinearProgressIndicator(color = composeColor, trackColor = trackColor)
            }
          }
        ProgressVariant.CIRCULAR ->
          AutoSizingComposable(shadowNodeProxy) {
            val composeColor = color.composeOrNull ?: ProgressIndicatorDefaults.circularColor
            if (progress != null) {
              CircularProgressIndicator(
                progress = { progress },
                color = composeColor,
                trackColor = colors.trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularDeterminateTrackColor,
                modifier = Modifier.fromExpoModifiers(props.modifiers.value)
              )
            } else {
              CircularProgressIndicator(
                color = composeColor,
                trackColor = colors.trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularIndeterminateTrackColor,
                modifier = Modifier.fromExpoModifiers(props.modifiers.value)
              )
            }
          }
      }
    }
  }
}
