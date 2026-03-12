package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.TriStateCheckbox
import androidx.compose.runtime.Composable
import androidx.compose.ui.state.ToggleableState
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import java.io.Serializable

class CheckboxColors : Record {
  @Field val checkedColor: Color? = null
  @Field val disabledCheckedColor: Color? = null
  @Field val uncheckedColor: Color? = null
  @Field val disabledUncheckedColor: Color? = null
  @Field val checkmarkColor: Color? = null
  @Field val disabledIndeterminateColor: Color? = null
}

data class CheckboxProps(
  val value: Boolean = false,
  val enabled: Boolean = true,
  val nativeClickable: Boolean = true,
  val colors: CheckboxColors = CheckboxColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.CheckboxContent(
  props: CheckboxProps,
  onCheckedChange: (CheckedChangeEvent) -> Unit
) {
  Checkbox(
    checked = props.value,
    onCheckedChange = if (props.nativeClickable) {
      { newChecked -> onCheckedChange(CheckedChangeEvent(newChecked)) }
    } else {
      null
    },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    enabled = props.enabled,
    colors = CheckboxDefaults.colors(
      checkedColor = props.colors.checkedColor.compose,
      disabledCheckedColor = props.colors.disabledCheckedColor.compose,
      uncheckedColor = props.colors.uncheckedColor.compose,
      disabledUncheckedColor = props.colors.disabledUncheckedColor.compose,
      checkmarkColor = props.colors.checkmarkColor.compose,
      disabledIndeterminateColor = props.colors.disabledIndeterminateColor.compose
    )
  )
}

enum class ToggleableStateValue(val value: String) : Enumerable {
  ON("on"),
  OFF("off"),
  INDETERMINATE("indeterminate")
}

open class ClickEvent() : Record, Serializable

data class TriStateCheckboxProps(
  val state: ToggleableStateValue = ToggleableStateValue.OFF,
  val enabled: Boolean = true,
  val nativeClickable: Boolean = true,
  val colors: CheckboxColors = CheckboxColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.TriStateCheckboxContent(
  props: TriStateCheckboxProps,
  onClick: (ClickEvent) -> Unit
) {
  TriStateCheckbox(
    state = when (props.state) {
      ToggleableStateValue.ON -> ToggleableState.On
      ToggleableStateValue.OFF -> ToggleableState.Off
      ToggleableStateValue.INDETERMINATE -> ToggleableState.Indeterminate
    },
    onClick = if (props.nativeClickable) {
      { onClick(ClickEvent()) }
    } else {
      null
    },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    enabled = props.enabled,
    colors = CheckboxDefaults.colors(
      checkedColor = props.colors.checkedColor.compose,
      disabledCheckedColor = props.colors.disabledCheckedColor.compose,
      uncheckedColor = props.colors.uncheckedColor.compose,
      disabledUncheckedColor = props.colors.disabledUncheckedColor.compose,
      checkmarkColor = props.colors.checkmarkColor.compose,
      disabledIndeterminateColor = props.colors.disabledIndeterminateColor.compose
    )
  )
}
