package expo.modules.ui

import android.graphics.Color
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.SliderState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps
import androidx.compose.material3.SliderColors as MaterialSliderColors

@OptimizedRecord
class SliderColors : Record {
  @Field
  val thumbColor: Color? = null

  @Field
  val activeTrackColor: Color? = null

  @Field
  val inactiveTrackColor: Color? = null

  @Field
  val activeTickColor: Color? = null

  @Field
  val inactiveTickColor: Color? = null

  @Field
  val disabledThumbColor: Color? = null

  @Field
  val disabledActiveTrackColor: Color? = null

  @Field
  val disabledInactiveTrackColor: Color? = null

  @Field
  val disabledActiveTickColor: Color? = null

  @Field
  val disabledInactiveTickColor: Color? = null
}

@Composable
internal fun SliderColors.toComposeColors(): MaterialSliderColors = SliderDefaults.colors(
  thumbColor = thumbColor.compose,
  activeTrackColor = activeTrackColor.compose,
  inactiveTrackColor = inactiveTrackColor.compose,
  activeTickColor = activeTickColor.compose,
  inactiveTickColor = inactiveTickColor.compose,
  disabledThumbColor = disabledThumbColor.compose,
  disabledActiveTrackColor = disabledActiveTrackColor.compose,
  disabledInactiveTrackColor = disabledInactiveTrackColor.compose,
  disabledActiveTickColor = disabledActiveTickColor.compose,
  disabledInactiveTickColor = disabledInactiveTickColor.compose
)

@OptimizedComposeProps
data class SliderProps(
  val value: Float = 0.0f,
  val min: Float = 0.0f,
  val max: Float = 1.0f,
  val lowerLimit: Float? = null,
  val upperLimit: Float? = null,
  val steps: Int = 0,
  val enabled: Boolean = true,
  val colors: SliderColors = SliderColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptimizedRecord
data class SliderValueChangedEvent(
  @Field val value: Float
) : Record

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.SliderContent(
  props: SliderProps,
  onValueChange: (SliderValueChangedEvent) -> Unit,
  onValueChangeFinished: (Unit) -> Unit
) {
  val interactionSource = remember { MutableInteractionSource() }

  val effectiveLower = maxOf(props.min, props.lowerLimit ?: Float.NEGATIVE_INFINITY)
  val effectiveUpper = minOf(props.max, props.upperLimit ?: Float.POSITIVE_INFINITY)

  var localValue by remember { mutableFloatStateOf(props.value.coerceIn(effectiveLower, effectiveUpper)) }
  val clampedPropsValue = props.value.coerceIn(effectiveLower, effectiveUpper)
  var prevPropsValue by remember { mutableFloatStateOf(clampedPropsValue) }

  val sliderState = remember(props.min, props.max, props.steps) {
    SliderState(
      value = localValue.coerceIn(effectiveLower, effectiveUpper),
      steps = props.steps,
      trackRange = props.min..props.max
    )
  }

  if (clampedPropsValue != prevPropsValue) {
    prevPropsValue = clampedPropsValue
    if (!sliderState.isDragging) {
      localValue = clampedPropsValue
    }
  }

  val thumbSlotView = findChildSlotView(view, "thumb")
  val trackSlotView = findChildSlotView(view, "track")

  val sliderColors = props.colors.toComposeColors()

  SideEffect {
    val target = localValue.coerceIn(effectiveLower, effectiveUpper)
    if (sliderState.value != target) {
      sliderState.value = target
    }
  }

  Slider(
    state = sliderState,
    enabled = props.enabled,
    interactionSource = interactionSource,
    onValueChange = {
      val clamped = it.coerceIn(effectiveLower, effectiveUpper)
      localValue = clamped
      sliderState.value = clamped
      onValueChange(SliderValueChangedEvent(clamped))
    },
    onValueChangeFinished = {
      onValueChangeFinished(Unit)
    },
    colors = sliderColors,
    thumb = {
      if (thumbSlotView != null) {
        with(UIComposableScope()) { with(thumbSlotView) { Content() } }
      } else {
        SliderDefaults.Thumb(
          interactionSource = interactionSource,
          colors = sliderColors,
          enabled = props.enabled
        )
      }
    },
    track = { sliderState ->
      if (trackSlotView != null) {
        with(UIComposableScope()) { with(trackSlotView) { Content() } }
      } else {
        SliderDefaults.Track(
          sliderState = sliderState,
          colors = sliderColors,
          enabled = props.enabled
        )
      }
    },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  )
}
