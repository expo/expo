package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
data class RadioButtonColors(
  @Field val selectedColor: Color? = null,
  @Field val unselectedColor: Color? = null,
  @Field val disabledSelectedColor: Color? = null,
  @Field val disabledUnselectedColor: Color? = null
) : Record

@OptimizedComposeProps
data class RadioButtonProps(
  val selected: Boolean = false,
  val enabled: Boolean = true,
  val clickable: Boolean = true,
  val colors: RadioButtonColors = RadioButtonColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.RadioButtonContent(
  props: RadioButtonProps,
  onClick: (() -> Unit)?
) {
  RadioButton(
    selected = props.selected,
    onClick = onClick,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    enabled = props.enabled,
    colors = RadioButtonDefaults.colors(
      selectedColor = props.colors.selectedColor.compose,
      unselectedColor = props.colors.unselectedColor.compose,
      disabledSelectedColor = props.colors.disabledSelectedColor.compose,
      disabledUnselectedColor = props.colors.disabledUnselectedColor.compose
    )
  )
}
