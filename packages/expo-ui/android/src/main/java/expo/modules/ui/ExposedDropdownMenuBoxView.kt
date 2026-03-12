package expo.modules.ui

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class ExposedDropdownMenuBoxProps(
  val value: String = "",
  val expanded: Boolean = false,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

data class ExposedDropdownMenuBoxExpandedChangeEvent(
  @Field val expanded: Boolean
) : Record

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.ExposedDropdownMenuBoxContent(
  props: ExposedDropdownMenuBoxProps,
  onExpandedChange: (ExposedDropdownMenuBoxExpandedChangeEvent) -> Unit
) {
  val labelSlotView = findChildSlotView(view, "label")
  val itemsSlotView = findChildSlotView(view, "items")

  ExposedDropdownMenuBox(
    expanded = props.expanded,
    onExpandedChange = { onExpandedChange(ExposedDropdownMenuBoxExpandedChangeEvent(it)) },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    TextField(
      value = props.value,
      onValueChange = {},
      readOnly = true,
      label = labelSlotView?.let {
        { with(ComposableScope()) { with(it) { Content() } } }
      },
      trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = props.expanded) },
      colors = ExposedDropdownMenuDefaults.textFieldColors(),
      modifier = Modifier.menuAnchor(MenuAnchorType.PrimaryNotEditable)
    )
    ExposedDropdownMenu(
      expanded = props.expanded,
      onDismissRequest = { onExpandedChange(ExposedDropdownMenuBoxExpandedChangeEvent(false)) }
    ) {
      itemsSlotView?.let {
        with(ComposableScope()) {
          with(it) {
            Content()
          }
        }
      }
    }
  }
}
