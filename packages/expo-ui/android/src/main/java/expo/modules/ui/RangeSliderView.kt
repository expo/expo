package expo.modules.ui

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material3.RangeSlider
import androidx.compose.material3.SliderDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.viewevent.getValue
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
data class RangeSliderValue(
  @Field val start: Float = 0.0f,
  @Field val end: Float = 1.0f
) : Record

@OptimizedComposeProps
data class RangeSliderProps(
  val value: RangeSliderValue = RangeSliderValue(),
  val min: Float = 0.0f,
  val max: Float = 1.0f,
  val steps: Int = 0,
  val enabled: Boolean = true,
  val colors: SliderColors = SliderColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptimizedRecord
data class RangeSliderValueChangedEvent(
  @Field val start: Float,
  @Field val end: Float
) : Record

@Composable
fun FunctionalComposableScope.RangeSliderContent(props: RangeSliderProps) {
  val onValueChange by remember { this@RangeSliderContent.EventDispatcher<RangeSliderValueChangedEvent>() }
  val onValueChangeFinished by remember { this@RangeSliderContent.EventDispatcher<Unit>() }
  val startInteractionSource = remember { MutableInteractionSource() }
  val endInteractionSource = remember { MutableInteractionSource() }

  var localStart by remember { mutableFloatStateOf(props.value.start) }
  var localEnd by remember { mutableFloatStateOf(props.value.end) }
  var isDragging by remember { mutableStateOf(false) }
  var prevStart by remember { mutableFloatStateOf(props.value.start) }
  var prevEnd by remember { mutableFloatStateOf(props.value.end) }

  if (props.value.start != prevStart || props.value.end != prevEnd) {
    prevStart = props.value.start
    prevEnd = props.value.end
    if (!isDragging) {
      localStart = props.value.start
      localEnd = props.value.end
    }
  }

  val startThumbSlotView = findChildSlotView(view, "startThumb")
  val endThumbSlotView = findChildSlotView(view, "endThumb")
  val trackSlotView = findChildSlotView(view, "track")

  val sliderColors = SliderDefaults.colors(
    thumbColor = props.colors.thumbColor.compose,
    activeTrackColor = props.colors.activeTrackColor.compose,
    inactiveTrackColor = props.colors.inactiveTrackColor.compose,
    activeTickColor = props.colors.activeTickColor.compose,
    inactiveTickColor = props.colors.inactiveTickColor.compose
  )

  RangeSlider(
    value = localStart..localEnd,
    valueRange = props.min..props.max,
    steps = props.steps,
    enabled = props.enabled,
    startInteractionSource = startInteractionSource,
    endInteractionSource = endInteractionSource,
    onValueChange = {
      isDragging = true
      localStart = it.start
      localEnd = it.endInclusive
      onValueChange(RangeSliderValueChangedEvent(it.start, it.endInclusive))
    },
    onValueChangeFinished = {
      isDragging = false
      onValueChangeFinished(Unit)
    },
    colors = sliderColors,
    startThumb = {
      if (startThumbSlotView != null) {
        startThumbSlotView.renderSlot()
      } else {
        SliderDefaults.Thumb(
          interactionSource = startInteractionSource,
          colors = sliderColors,
          enabled = props.enabled
        )
      }
    },
    endThumb = {
      if (endThumbSlotView != null) {
        endThumbSlotView.renderSlot()
      } else {
        SliderDefaults.Thumb(
          interactionSource = endInteractionSource,
          colors = sliderColors,
          enabled = props.enabled
        )
      }
    },
    track = { rangeSliderState ->
      if (trackSlotView != null) {
        trackSlotView.renderSlot()
      } else {
        SliderDefaults.Track(
          rangeSliderState = rangeSliderState,
          colors = sliderColors,
          enabled = props.enabled
        )
      }
    },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  )
}
