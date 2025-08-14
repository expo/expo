package expo.modules.ui

import android.content.Context
import android.graphics.Color
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.AutoSizingComposable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import java.io.Serializable

open class ValueChangeEvent(
  @Field open val value: Boolean = false
) : Record, Serializable

class SwitchColors : Record {
  @Field
  val checkedThumbColor: Color? = null

  @Field
  val checkedTrackColor: Color? = null

  @Field
  val uncheckedThumbColor: Color? = null

  @Field
  val uncheckedTrackColor: Color? = null

  @Field
  val checkedColor: Color? = null

  @Field
  val disabledCheckedColor: Color? = null

  @Field
  val uncheckedColor: Color? = null

  @Field
  val disabledUncheckedColor: Color? = null

  @Field
  val checkmarkColor: Color? = null

  @Field
  val disabledIndeterminateColor: Color? = null
}

data class SwitchProps(
  val value: MutableState<Boolean> = mutableStateOf(false),
  val variant: MutableState<String> = mutableStateOf("switch"),
  val elementColors: MutableState<SwitchColors> = mutableStateOf(SwitchColors()),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

@Composable
fun SwitchComposable(checked: Boolean, onCheckedChange: ((Boolean) -> Unit)?, colors: SwitchColors, modifier: Modifier = Modifier) {
  Switch(
    checked = checked,
    onCheckedChange = onCheckedChange,
    modifier = modifier,
    colors = SwitchDefaults.colors(
      // For some reason the default way of passing colors using `compose` results in a transparent view
      checkedThumbColor = colors.checkedThumbColor.composeOrNull
        ?: SwitchDefaults.colors().checkedThumbColor,
      checkedTrackColor = colors.checkedTrackColor.composeOrNull
        ?: SwitchDefaults.colors().checkedTrackColor,
      uncheckedThumbColor = colors.uncheckedThumbColor.composeOrNull
        ?: SwitchDefaults.colors().uncheckedThumbColor,
      uncheckedTrackColor = colors.uncheckedTrackColor.composeOrNull
        ?: SwitchDefaults.colors().uncheckedTrackColor
    )
  )
}

@Composable
fun CheckboxComposable(checked: Boolean, onCheckedChange: ((Boolean) -> Unit)?, colors: SwitchColors, modifier: Modifier) {
  Checkbox(
    checked = checked,
    onCheckedChange = onCheckedChange,
    modifier = modifier,
    colors = CheckboxDefaults.colors(
      checkedColor = colors.checkedColor.compose,
      disabledCheckedColor = colors.disabledCheckedColor.compose,
      uncheckedColor = colors.uncheckedColor.compose,
      disabledUncheckedColor = colors.disabledUncheckedColor.compose,
      checkmarkColor = colors.checkmarkColor.compose,
      disabledIndeterminateColor = colors.disabledIndeterminateColor.compose
    )
  )
}

@Composable
fun ThemedHybridSwitch(
  variant: String,
  checked: Boolean,
  onCheckedChange: ((Boolean) -> Unit)?,
  colors: SwitchColors,
  modifier: Modifier = Modifier
) {
  DynamicTheme {
    when (variant) {
      "switch" -> SwitchComposable(checked, onCheckedChange, colors, modifier)
      else -> CheckboxComposable(checked, onCheckedChange, colors, modifier)
    }
  }
}

class SwitchView(context: Context, appContext: AppContext) :
  ExpoComposeView<SwitchProps>(context, appContext, withHostingView = true) {
  override val props = SwitchProps()
  private val onValueChange by EventDispatcher<ValueChangeEvent>()

  @Composable
  override fun Content(modifier: Modifier) {
    val (checked) = props.value
    val (variant) = props.variant
    val (colors) = props.elementColors
    val onCheckedChange = { checked: Boolean ->
      onValueChange(ValueChangeEvent(checked))
    }

    AutoSizingComposable(shadowNodeProxy) {
      ThemedHybridSwitch(variant, checked, onCheckedChange, colors, modifier.fromExpoModifiers(props.modifiers.value))
    }
  }
}
