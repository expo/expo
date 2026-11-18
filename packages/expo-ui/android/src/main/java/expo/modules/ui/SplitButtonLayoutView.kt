@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.SplitButtonDefaults
import androidx.compose.material3.SplitButtonLayout
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.button.ButtonColors

@OptimizedComposeProps
data class SplitButtonLayoutProps(
  val spacing: Float? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptimizedComposeProps
data class SplitButtonLeadingButtonProps(
  val enabled: Boolean = true,
  val colors: ButtonColors = ButtonColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptimizedComposeProps
data class SplitButtonTrailingButtonProps(
  val checked: Boolean = false,
  val enabled: Boolean = true,
  val colors: ButtonColors = ButtonColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptimizedRecord
data class SplitButtonCheckedChangeEvent(
  @Field val checked: Boolean = false
) : Record

@Composable
fun FunctionalComposableScope.SplitButtonLayoutContent(props: SplitButtonLayoutProps) {
  SplitButtonLayout(
    leadingButton = { Children(UIComposableScope(), filter = { isSlotWithName(it, "leadingButton") }) },
    trailingButton = { Children(UIComposableScope(), filter = { isSlotWithName(it, "trailingButton") }) },
    spacing = props.spacing?.dp ?: SplitButtonDefaults.Spacing,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  )
}

@Composable
fun FunctionalComposableScope.SplitButtonLeadingButtonContent(
  props: SplitButtonLeadingButtonProps,
  onClick: () -> Unit
) {
  SplitButtonDefaults.LeadingButton(
    onClick = onClick,
    enabled = props.enabled,
    colors = ButtonDefaults.buttonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope(rowScope = this))
  }
}

@Composable
fun FunctionalComposableScope.SplitButtonTrailingButtonContent(
  props: SplitButtonTrailingButtonProps,
  onCheckedChange: (SplitButtonCheckedChangeEvent) -> Unit
) {
  SplitButtonDefaults.TrailingButton(
    checked = props.checked,
    onCheckedChange = { onCheckedChange(SplitButtonCheckedChangeEvent(it)) },
    enabled = props.enabled,
    colors = ButtonDefaults.buttonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope(rowScope = this))
  }
}
