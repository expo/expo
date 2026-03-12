package expo.modules.ui

import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.InputChip
import androidx.compose.material3.SuggestionChip
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import java.io.Serializable

open class ChipPressedEvent : Record, Serializable

private fun FunctionalComposableScope.slotContent(slotName: String): (@Composable () -> Unit)? {
  return findChildSlotView(view, slotName)?.let { slotView ->
    {
      with(ComposableScope()) {
        with(slotView) {
          Content()
        }
      }
    }
  }
}

// region AssistChip

data class AssistChipProps(
  val enabled: Boolean = true,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.AssistChipContent(
  props: AssistChipProps,
  onPress: (ChipPressedEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  AssistChip(
    onClick = { onPress(ChipPressedEvent()) },
    label = slotContent("label") ?: {},
    leadingIcon = slotContent("leadingIcon"),
    trailingIcon = slotContent("trailingIcon"),
    enabled = props.enabled,
    colors = AssistChipDefaults.assistChipColors(),
    border = AssistChipDefaults.assistChipBorder(enabled = props.enabled),
    modifier = modifier
  )
}

// endregion

// region InputChip

data class InputChipProps(
  val enabled: Boolean = true,
  val selected: Boolean = false,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.InputChipContent(
  props: InputChipProps,
  onPress: (ChipPressedEvent) -> Unit
) {
  if (!props.enabled) return

  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  InputChip(
    onClick = { onPress(ChipPressedEvent()) },
    label = slotContent("label") ?: {},
    enabled = props.enabled,
    selected = props.selected,
    avatar = slotContent("avatar"),
    trailingIcon = slotContent("trailingIcon"),
    modifier = modifier
  )
}

// endregion

// region SuggestionChip

data class SuggestionChipProps(
  val enabled: Boolean = true,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SuggestionChipContent(
  props: SuggestionChipProps,
  onPress: (ChipPressedEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  SuggestionChip(
    onClick = { onPress(ChipPressedEvent()) },
    label = slotContent("label") ?: {},
    icon = slotContent("icon"),
    enabled = props.enabled,
    modifier = modifier
  )
}

// endregion
