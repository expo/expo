package expo.modules.ui

import android.content.Context
import android.graphics.Color
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps

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
  val value: MutableState<Float> = mutableFloatStateOf(0.0f),
  val min: MutableState<Float> = mutableFloatStateOf(0.0f),
  val max: MutableState<Float> = mutableFloatStateOf(1.0f),
  val steps: MutableState<Int> = mutableIntStateOf(0),
  val elementColors: MutableState<SliderColors> = mutableStateOf(SliderColors()),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

class SliderView(context: Context, appContext: AppContext) :
  ExpoComposeView<SliderProps>(context, appContext, withHostingView = true) {
  override val props = SliderProps()
  private val onValueChanged by EventDispatcher()

  @Composable
  override fun Content(modifier: Modifier) {
    val (value) = props.value
    val (min) = props.min
    val (max) = props.max
    val (steps) = props.steps
    val (colors) = props.elementColors
    DynamicTheme {
      Slider(
        value = value.coerceAtLeast(min).coerceAtMost(max),
        valueRange = min..max,
        steps = steps,
        onValueChange = {
          onValueChanged(mapOf("value" to it))
        },
        colors = SliderDefaults.colors(
          thumbColor = colors.thumbColor.compose,
          activeTrackColor = colors.activeTrackColor.compose,
          inactiveTrackColor = colors.inactiveTrackColor.compose,
          activeTickColor = colors.activeTickColor.compose,
          inactiveTickColor = colors.inactiveTickColor.compose
        ),
        modifier = Modifier.fromExpoModifiers(props.modifiers.value)
      )
    }
  }
}
