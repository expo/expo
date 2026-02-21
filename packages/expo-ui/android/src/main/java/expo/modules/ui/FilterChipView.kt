package expo.modules.ui

import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import java.io.Serializable

open class FilterChipPressedEvent : Record, Serializable

data class FilterChipProps(
  val selected: Boolean = false,
  val label: String = "",
  val enabled: Boolean = true,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.FilterChipContent(
  props: FilterChipProps,
  onPress: (FilterChipPressedEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val leadingIconSlotView = findChildSlotView(view, "leadingIcon")
  val trailingIconSlotView = findChildSlotView(view, "trailingIcon")

  FilterChip(
    selected = props.selected,
    onClick = { onPress(FilterChipPressedEvent()) },
    label = { Text(props.label) },
    enabled = props.enabled,
    leadingIcon = leadingIconSlotView?.let {
      {
        with(ComposableScope()) {
          with(it) {
            Content()
          }
        }
      }
    },
    trailingIcon = trailingIconSlotView?.let {
      {
        with(ComposableScope()) {
          with(it) {
            Content()
          }
        }
      }
    },
    colors = FilterChipDefaults.filterChipColors(),
    border = FilterChipDefaults.filterChipBorder(enabled = props.enabled, selected = props.selected),
    modifier = modifier
  )
}
