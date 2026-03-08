package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
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
  val checkedBorderColor: Color? = null

  @Field
  val checkedIconColor: Color? = null

  @Field
  val uncheckedThumbColor: Color? = null

  @Field
  val uncheckedTrackColor: Color? = null

  @Field
  val uncheckedBorderColor: Color? = null

  @Field
  val uncheckedIconColor: Color? = null

  @Field
  val disabledCheckedThumbColor: Color? = null

  @Field
  val disabledCheckedTrackColor: Color? = null

  @Field
  val disabledCheckedBorderColor: Color? = null

  @Field
  val disabledCheckedIconColor: Color? = null

  @Field
  val disabledUncheckedThumbColor: Color? = null

  @Field
  val disabledUncheckedTrackColor: Color? = null

  @Field
  val disabledUncheckedBorderColor: Color? = null

  @Field
  val disabledUncheckedIconColor: Color? = null

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
  val value: Boolean = false,
  val enabled: Boolean = true,
  val variant: String = "switch",
  val elementColors: SwitchColors = SwitchColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun SwitchComposable(
  checked: Boolean,
  onCheckedChange: ((Boolean) -> Unit)?,
  colors: SwitchColors,
  modifier: Modifier = Modifier,
  enabled: Boolean = true,
  thumbContent: (@Composable () -> Unit)? = null
) {
  Switch(
    checked = checked,
    onCheckedChange = onCheckedChange,
    modifier = modifier,
    enabled = enabled,
    thumbContent = thumbContent,
    colors = SwitchDefaults.colors(
      // For some reason the default way of passing colors using `compose` results in a transparent view
      checkedThumbColor = colors.checkedThumbColor.composeOrNull
        ?: SwitchDefaults.colors().checkedThumbColor,
      checkedTrackColor = colors.checkedTrackColor.composeOrNull
        ?: SwitchDefaults.colors().checkedTrackColor,
      checkedBorderColor = colors.checkedBorderColor.composeOrNull
        ?: SwitchDefaults.colors().checkedBorderColor,
      checkedIconColor = colors.checkedIconColor.composeOrNull
        ?: SwitchDefaults.colors().checkedIconColor,
      uncheckedThumbColor = colors.uncheckedThumbColor.composeOrNull
        ?: SwitchDefaults.colors().uncheckedThumbColor,
      uncheckedTrackColor = colors.uncheckedTrackColor.composeOrNull
        ?: SwitchDefaults.colors().uncheckedTrackColor,
      uncheckedBorderColor = colors.uncheckedBorderColor.composeOrNull
        ?: SwitchDefaults.colors().uncheckedBorderColor,
      uncheckedIconColor = colors.uncheckedIconColor.composeOrNull
        ?: SwitchDefaults.colors().uncheckedIconColor,
      disabledCheckedBorderColor = colors.disabledCheckedBorderColor.composeOrNull
        ?: SwitchDefaults.colors().disabledCheckedBorderColor,
      disabledCheckedThumbColor = colors.disabledCheckedThumbColor.composeOrNull
        ?: SwitchDefaults.colors().disabledCheckedThumbColor,
      disabledCheckedTrackColor = colors.disabledCheckedTrackColor.composeOrNull
        ?: SwitchDefaults.colors().disabledCheckedTrackColor,
      disabledCheckedIconColor = colors.disabledCheckedIconColor.composeOrNull
        ?: SwitchDefaults.colors().disabledCheckedIconColor,
      disabledUncheckedBorderColor = colors.disabledUncheckedBorderColor.composeOrNull
        ?: SwitchDefaults.colors().disabledUncheckedBorderColor,
      disabledUncheckedThumbColor = colors.disabledUncheckedThumbColor.composeOrNull
        ?: SwitchDefaults.colors().disabledUncheckedThumbColor,
      disabledUncheckedTrackColor = colors.disabledUncheckedTrackColor.composeOrNull
        ?: SwitchDefaults.colors().disabledUncheckedTrackColor,
      disabledUncheckedIconColor = colors.disabledUncheckedIconColor.composeOrNull
        ?: SwitchDefaults.colors().disabledUncheckedIconColor
    )
  )
}

@Composable
fun CheckboxComposable(checked: Boolean, onCheckedChange: ((Boolean) -> Unit)?, colors: SwitchColors, modifier: Modifier, enabled: Boolean = true) {
  Checkbox(
    checked = checked,
    onCheckedChange = onCheckedChange,
    modifier = modifier,
    enabled = enabled,
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
  modifier: Modifier = Modifier,
  enabled: Boolean = true,
  thumbContent: (@Composable () -> Unit)? = null
) {
  when (variant) {
    "switch" -> SwitchComposable(checked, onCheckedChange, colors, modifier, enabled, thumbContent)
    else -> CheckboxComposable(checked, onCheckedChange, colors, modifier, enabled)
  }
}

@Composable
fun FunctionalComposableScope.SwitchContent(
  props: SwitchProps,
  onValueChange: (ValueChangeEvent) -> Unit
) {
  val thumbContentSlotView = findChildSlotView(view, "thumbContent")

  ThemedHybridSwitch(
    props.variant,
    props.value,
    { newChecked -> onValueChange(ValueChangeEvent(newChecked)) },
    props.elementColors,
    ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    props.enabled,
    thumbContent = thumbContentSlotView?.let {
      {
        with(ComposableScope()) {
          with(it) {
            Content()
          }
        }
      }
    }
  )
}
