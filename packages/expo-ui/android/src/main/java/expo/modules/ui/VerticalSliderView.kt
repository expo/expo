@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.SliderState
import androidx.compose.material3.VerticalSlider
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import expo.modules.kotlin.viewevent.getValue
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class VerticalSliderProps(
  val value: Float = 0.0f,
  val min: Float = 0.0f,
  val max: Float = 1.0f,
  val lowerLimit: Float? = null,
  val upperLimit: Float? = null,
  val steps: Int = 0,
  val enabled: Boolean = true,
  val reverseDirection: Boolean = false,
  val colors: SliderColors = SliderColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.VerticalSliderContent(props: VerticalSliderProps) {
  val onValueChange by remember { this@VerticalSliderContent.EventDispatcher<SliderValueChangedEvent>() }
  val onValueChangeFinished by remember { this@VerticalSliderContent.EventDispatcher<Unit>() }
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
  val modifier = ModifierRegistry.applyModifiers(
    props.modifiers,
    appContext,
    composableScope,
    globalEventDispatcher
  )

  val sliderState = remember(props.min, props.max, props.steps) {
    SliderState(
      value = localValue,
      steps = props.steps,
      valueRange = props.min..props.max
    )
  }
  sliderState.onValueChange = {
    val clamped = it.coerceIn(effectiveLower, effectiveUpper)
    isDragging = true
    localValue = clamped
    onValueChange(SliderValueChangedEvent(clamped))
  }
  sliderState.onValueChangeFinished = {
    isDragging = false
    onValueChangeFinished(Unit)
  }
  sliderState.value = localValue

  when {
    thumbSlotView != null && trackSlotView != null -> VerticalSlider(
      state = sliderState,
      enabled = props.enabled,
      reverseDirection = props.reverseDirection,
      colors = sliderColors,
      interactionSource = interactionSource,
      thumb = {
        with(UIComposableScope()) { with(thumbSlotView) { Content() } }
      },
      track = {
        with(UIComposableScope()) { with(trackSlotView) { Content() } }
      },
      modifier = modifier
    )

    thumbSlotView != null -> VerticalSlider(
      state = sliderState,
      enabled = props.enabled,
      reverseDirection = props.reverseDirection,
      colors = sliderColors,
      interactionSource = interactionSource,
      thumb = {
        with(UIComposableScope()) { with(thumbSlotView) { Content() } }
      },
      modifier = modifier
    )

    trackSlotView != null -> VerticalSlider(
      state = sliderState,
      enabled = props.enabled,
      reverseDirection = props.reverseDirection,
      colors = sliderColors,
      interactionSource = interactionSource,
      track = {
        with(UIComposableScope()) { with(trackSlotView) { Content() } }
      },
      modifier = modifier
    )

    else -> VerticalSlider(
      state = sliderState,
      enabled = props.enabled,
      reverseDirection = props.reverseDirection,
      colors = sliderColors,
      interactionSource = interactionSource,
      modifier = modifier
    )
  }
}
