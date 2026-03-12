package expo.modules.ui

import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import java.io.Serializable

open class FilterChipPressedEvent : Record, Serializable

data class FilterChipProps(
  val selected: Boolean = false,
  val enabled: Boolean = true,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.FilterChipContent(
  props: FilterChipProps,
  onPress: (FilterChipPressedEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val labelSlotView = findChildSlotView(view, "label")
  val leadingIconSlotView = findChildSlotView(view, "leadingIcon")
  val trailingIconSlotView = findChildSlotView(view, "trailingIcon")

  FilterChip(
    selected = props.selected,
    onClick = { onPress(FilterChipPressedEvent()) },
    label = labelSlotView?.let {
      {
        with(ComposableScope()) {
          with(it) {
            Content()
          }
        }
      }
    } ?: {},
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
