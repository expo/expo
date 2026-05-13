package expo.modules.ui

import android.graphics.Color
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.viewevent.getValue
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps

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
}

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
fun FunctionalComposableScope.SliderContent(props: SliderProps) {
  val onValueChange by remember { this@SliderContent.EventDispatcher<SliderValueChangedEvent>() }
  val onValueChangeFinished by remember { this@SliderContent.EventDispatcher<Unit>() }
  val interactionSource = remember { MutableInteractionSource() }

  val effectiveLower = maxOf(props.min, props.lowerLimit ?: Float.NEGATIVE_INFINITY)
  val effectiveUpper = minOf(props.max, props.upperLimit ?: Float.POSITIVE_INFINITY)

  var localValue by remember { mutableFloatStateOf(props.value.coerceIn(effectiveLower, effectiveUpper)) }
  var isDragging by remember { mutableStateOf(false) }
  val clampedPropsValue = props.value.coerceIn(effectiveLower, effectiveUpper)
  var prevPropsValue by remember { mutableFloatStateOf(clampedPropsValue) }

  if (clampedPropsValue != prevPropsValue) {
    prevPropsValue = clampedPropsValue
    if (!isDragging) {
      localValue = clampedPropsValue
    }
  }

  val thumbSlotView = findChildSlotView(view, "thumb")
  val trackSlotView = findChildSlotView(view, "track")

  val sliderColors = SliderDefaults.colors(
    thumbColor = props.colors.thumbColor.compose,
    activeTrackColor = props.colors.activeTrackColor.compose,
    inactiveTrackColor = props.colors.inactiveTrackColor.compose,
    activeTickColor = props.colors.activeTickColor.compose,
    inactiveTickColor = props.colors.inactiveTickColor.compose
  )

  Slider(
    value = localValue,
    valueRange = props.min..props.max,
    steps = props.steps,
    enabled = props.enabled,
    interactionSource = interactionSource,
    onValueChange = {
      val clamped = it.coerceIn(effectiveLower, effectiveUpper)
      isDragging = true
      localValue = clamped
      onValueChange(SliderValueChangedEvent(clamped))
    },
    onValueChangeFinished = {
      isDragging = false
      onValueChangeFinished(Unit)
    },
    colors = sliderColors,
    thumb = { sliderState ->
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
