package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.viewevent.getValue
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

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

data class SliderProps(
  val value: Float = 0.0f,
  val min: Float = 0.0f,
  val max: Float = 1.0f,
  val steps: Int = 0,
  val elementColors: SliderColors = SliderColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

data class SliderValueChangedEvent(
  @Field val value: Float
) : Record

@Composable
fun FunctionalComposableScope.SliderContent(props: SliderProps) {
  val onValueChanged by remember { this@SliderContent.EventDispatcher<SliderValueChangedEvent>() }
  val colors = props.elementColors
  Slider(
    value = props.value.coerceAtLeast(props.min).coerceAtMost(props.max),
    valueRange = props.min..props.max,
    steps = props.steps,
    onValueChange = {
      onValueChanged(SliderValueChangedEvent(it))
    },
    colors = SliderDefaults.colors(
      thumbColor = colors.thumbColor.compose,
      activeTrackColor = colors.activeTrackColor.compose,
      inactiveTrackColor = colors.inactiveTrackColor.compose,
      activeTickColor = colors.activeTickColor.compose,
      inactiveTickColor = colors.inactiveTickColor.compose
    ),
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)
  )
}
