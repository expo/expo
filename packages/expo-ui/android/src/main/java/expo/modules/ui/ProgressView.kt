@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import android.content.Context
import android.graphics.Color
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.CircularWavyProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.LinearWavyProgressIndicator
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
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.Direction
import expo.modules.kotlin.views.ExpoComposeView
import java.util.EnumSet

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
  val variant: MutableState<ProgressVariant> = mutableStateOf(ProgressVariant.CIRCULAR),
  val progress: MutableState<Float?> = mutableStateOf(null),
  val color: MutableState<Color?> = mutableStateOf(null),
  val elementColors: MutableState<ProgressColors> = mutableStateOf(ProgressColors()),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

class ProgressView(context: Context, appContext: AppContext) :
  ExpoComposeView<ProgressProps>(context, appContext) {
  override val props = ProgressProps()

  @Composable
  override fun ComposableScope.Content() {
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
              LinearProgressIndicator(
                color = composeColor,
                trackColor = trackColor,
                modifier = Modifier.fromExpoModifiers(props.modifiers.value)
              )
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
        ProgressVariant.LINEAR_WAVY ->
          AutoSizingComposable(shadowNodeProxy, axis = EnumSet.of(Direction.VERTICAL)) {
            val composeColor = color.composeOrNull ?: ProgressIndicatorDefaults.linearColor
            val trackColor = colors.trackColor.composeOrNull ?: ProgressIndicatorDefaults.linearTrackColor
            if (progress != null) {
              LinearWavyProgressIndicator(
                progress = { progress },
                color = composeColor,
                trackColor = trackColor,
                modifier = Modifier.fromExpoModifiers(props.modifiers.value)
              )
            } else {
              LinearWavyProgressIndicator(
                color = composeColor,
                trackColor = trackColor,
                modifier = Modifier.fromExpoModifiers(props.modifiers.value)
              )
            }
          }
        ProgressVariant.CIRCULAR_WAVY ->
          AutoSizingComposable(shadowNodeProxy) {
            val composeColor = color.composeOrNull ?: ProgressIndicatorDefaults.circularColor
            if (progress != null) {
              CircularWavyProgressIndicator(
                progress = { progress },
                color = composeColor,
                trackColor = colors.trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularDeterminateTrackColor,
                modifier = Modifier.fromExpoModifiers(props.modifiers.value)
              )
            } else {
              CircularWavyProgressIndicator(
                color = composeColor,
                trackColor = colors.trackColor.composeOrNull ?: ProgressIndicatorDefaults.circularDeterminateTrackColor,
                modifier = Modifier.fromExpoModifiers(props.modifiers.value)
              )
            }
          }
      }
    }
  }
}
