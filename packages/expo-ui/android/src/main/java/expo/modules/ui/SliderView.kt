package expo.modules.ui

import android.content.Context
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import expo.modules.kotlin.AppContext

data class SliderProps(
  val value: MutableState<Float> = mutableFloatStateOf(0.0f),
  val min: MutableState<Float> = mutableFloatStateOf(0.0f),
  val max: MutableState<Float> = mutableFloatStateOf(1.0f),
  val steps: MutableState<Int> = mutableIntStateOf(0),
)

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
        }
      )
    }
  }
}
