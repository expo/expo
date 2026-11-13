package expo.modules.ui

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsDraggedAsState
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.RangeSlider
import androidx.compose.material3.RangeSliderState
import androidx.compose.material3.SliderDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
data class RangeSliderRange(
  @Field val start: Float = 0f,
  @Field val endInclusive: Float = 1f
) : Record

@OptimizedComposeProps
data class RangeSliderProps(
  val startValue: Float = 0f,
  val endValue: Float = 1f,
  val trackRange: RangeSliderRange = RangeSliderRange(),
  val steps: Int = 0,
  val enabled: Boolean = true,
  val colors: SliderColors = SliderColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.RangeSliderContent(
  props: RangeSliderProps,
  onValueChange: (RangeSliderRange) -> Unit,
  onValueChangeFinished: (Unit) -> Unit
) {
  val startInteractionSource = remember { MutableInteractionSource() }
  val endInteractionSource = remember { MutableInteractionSource() }
  val isStartDragging by startInteractionSource.collectIsDraggedAsState()
  val isEndDragging by endInteractionSource.collectIsDraggedAsState()
  val trackRange = props.trackRange.start..props.trackRange.endInclusive
  var state by remember {
    mutableStateOf(RangeSliderState(props.startValue, props.endValue, props.steps, trackRange))
  }
  val values = props.startValue to props.endValue
  var previousValues by remember { mutableStateOf(values) }
  val valuesChanged = values != previousValues
  val configurationChanged = state.steps != props.steps || state.trackRange != trackRange

  if (valuesChanged) {
    previousValues = values
  }
  if (configurationChanged || (valuesChanged && !isStartDragging && !isEndDragging)) {
    val start = if (valuesChanged) {
      props.startValue
    } else {
      state.startValue
    }
    val end = if (valuesChanged) {
      props.endValue
    } else {
      state.endValue
    }
    if (configurationChanged || start != state.startValue || end != state.endValue) {
      // Construct the pair together: each native setter clamps against the other endpoint.
      state = RangeSliderState(start, end, props.steps, trackRange)
    }
  }

  val startThumb = findChildSlotView(view, "startThumb")
  val endThumb = findChildSlotView(view, "endThumb")
  val track = findChildSlotView(view, "track")
  val colors = props.colors.toComposeColors()

  RangeSlider(
    state = state,
    onValueChange = {
      state.startValue = it.start
      state.endValue = it.endInclusive
      onValueChange(RangeSliderRange(state.startValue, state.endValue))
    },
    onValueChangeFinished = { onValueChangeFinished(Unit) },
    enabled = props.enabled,
    colors = colors,
    startThumbInteractionSource = startInteractionSource,
    endThumbInteractionSource = endInteractionSource,
    startThumb = {
      if (startThumb != null) {
        with(UIComposableScope()) { with(startThumb) { Content() } }
      } else {
        SliderDefaults.Thumb(
          interactionSource = startInteractionSource,
          colors = colors,
          enabled = props.enabled
        )
      }
    },
    endThumb = {
      if (endThumb != null) {
        with(UIComposableScope()) { with(endThumb) { Content() } }
      } else {
        SliderDefaults.Thumb(
          interactionSource = endInteractionSource,
          colors = colors,
          enabled = props.enabled
        )
      }
    },
    track = {
      if (track != null) {
        with(UIComposableScope()) { with(track) { Content() } }
      } else {
        SliderDefaults.Track(rangeSliderState = it, colors = colors, enabled = props.enabled)
      }
    },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  )
}
