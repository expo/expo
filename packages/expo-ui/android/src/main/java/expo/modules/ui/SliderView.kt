package expo.modules.ui

import android.content.Context
import android.graphics.Color
import android.os.Build
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.draw.alpha
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

fun convertColor(color: Color?): androidx.compose.ui.graphics.Color? {
  return color?.let {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      androidx.compose.ui.graphics.Color(it.red(), it.green(), it.blue(), it.alpha())
    } else {
      null
    }
  }
}

data class SliderProps(
  val value: MutableState<Float> = mutableFloatStateOf(0.0f),
  val min: MutableState<Float> = mutableFloatStateOf(0.0f),
  val max: MutableState<Float> = mutableFloatStateOf(1.0f),
  val steps: MutableState<Int> = mutableIntStateOf(0),
  val colors: MutableState<SliderColors> = mutableStateOf(SliderColors())
) : ComposeProps

class SliderView(context: Context, appContext: AppContext) : ExpoComposeView<SliderProps>(context, appContext) {
  override val props = SliderProps()
  private val onValueChanged by EventDispatcher()

  init {
    setContent {
      val (value) = props.value
      val (min) = props.min
      val (max) = props.max
      val (steps) = props.steps
      Slider(
        value = value.coerceAtLeast(min).coerceAtMost(max),
        valueRange = min..max,
        steps = steps,
        onValueChange = {
          onValueChanged(mapOf("value" to it))
        },
        colors = SliderDefaults.colors(
          thumbColor = convertColor(props.colors.value.thumbColor) ?: SliderDefaults.colors().thumbColor,
          activeTrackColor = convertColor(props.colors.value.activeTrackColor) ?: SliderDefaults.colors().activeTrackColor,
          inactiveTrackColor = convertColor(props.colors.value.inactiveTrackColor) ?: SliderDefaults.colors().inactiveTrackColor,
          activeTickColor = convertColor(props.colors.value.activeTickColor) ?: SliderDefaults.colors().activeTickColor,
          inactiveTickColor = convertColor(props.colors.value.inactiveTickColor) ?: SliderDefaults.colors().inactiveTickColor
        )
      )
    }
  }
}
