@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.FilledIconToggleButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.IconToggleButton
import androidx.compose.material3.OutlinedIconToggleButton
import androidx.compose.material3.ToggleButton
import androidx.compose.material3.ToggleButtonDefaults
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
data class ToggleButtonColors(
  @Field val containerColor: Color? = null,
  @Field val contentColor: Color? = null,
  @Field val checkedContainerColor: Color? = null,
  @Field val checkedContentColor: Color? = null,
  @Field val disabledContainerColor: Color? = null,
  @Field val disabledContentColor: Color? = null
) : Record

@OptimizedComposeProps
data class ToggleButtonProps(
  val checked: Boolean = false,
  val enabled: Boolean = true,
  val colors: ToggleButtonColors = ToggleButtonColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptimizedRecord
data class ToggleButtonValueChangeEvent(
  @Field val checked: Boolean = false
) : Record

@Composable
fun FunctionalComposableScope.ToggleButtonContent(
  props: ToggleButtonProps,
  onCheckedChange: (ToggleButtonValueChangeEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ToggleButton(
    checked = props.checked,
    onCheckedChange = { onCheckedChange(ToggleButtonValueChangeEvent(it)) },
    enabled = props.enabled,
    modifier = modifier,
    colors = ToggleButtonDefaults.toggleButtonColors(
      checkedContainerColor = props.colors.checkedContainerColor.compose,
      checkedContentColor = props.colors.checkedContentColor.compose,
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    )
  ) {
    Children(UIComposableScope(rowScope = this))
  }
}

@Composable
fun FunctionalComposableScope.IconToggleButtonContent(
  props: ToggleButtonProps,
  onCheckedChange: (ToggleButtonValueChangeEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  IconToggleButton(
    checked = props.checked,
    onCheckedChange = { onCheckedChange(ToggleButtonValueChangeEvent(it)) },
    enabled = props.enabled,
    modifier = modifier,
    colors = IconButtonDefaults.iconToggleButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      checkedContainerColor = props.colors.checkedContainerColor.compose,
      checkedContentColor = props.colors.checkedContentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    )
  ) {
    Children(UIComposableScope())
  }
}

@Composable
fun FunctionalComposableScope.FilledIconToggleButtonContent(
  props: ToggleButtonProps,
  onCheckedChange: (ToggleButtonValueChangeEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  FilledIconToggleButton(
    checked = props.checked,
    onCheckedChange = { onCheckedChange(ToggleButtonValueChangeEvent(it)) },
    enabled = props.enabled,
    modifier = modifier,
    colors = IconButtonDefaults.filledIconToggleButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      checkedContainerColor = props.colors.checkedContainerColor.compose,
      checkedContentColor = props.colors.checkedContentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    )
  ) {
    Children(UIComposableScope())
  }
}

@Composable
fun FunctionalComposableScope.OutlinedIconToggleButtonContent(
  props: ToggleButtonProps,
  onCheckedChange: (ToggleButtonValueChangeEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  OutlinedIconToggleButton(
    checked = props.checked,
    onCheckedChange = { onCheckedChange(ToggleButtonValueChangeEvent(it)) },
    enabled = props.enabled,
    modifier = modifier,
    colors = IconButtonDefaults.outlinedIconToggleButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      checkedContainerColor = props.colors.checkedContainerColor.compose,
      checkedContentColor = props.colors.checkedContentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    )
  ) {
    Children(UIComposableScope())
  }
}
