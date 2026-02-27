package expo.modules.ui

import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class NavigationRailItemRecord(
  @Field val icon: String = "",
  @Field val label: String? = null,
  @Field val badge: String? = null
) : Record

data class NavigationRailProps(
  val items: List<NavigationRailItemRecord> = emptyList(),
  val selectedIndex: Int = 0,
  val labelVisibility: String = "auto",
  val modifiers: ModifierList = emptyList()
) : ComposeProps

data class NavigationRailSelectedEvent(
  @Field val index: Int
) : Record

@Composable
fun FunctionalComposableScope.NavigationRailContent(
  props: NavigationRailProps,
  onItemSelected: (NavigationRailSelectedEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  val headerSlotView = findChildSlotView(view, "header")

  NavigationRail(
    modifier = modifier,
    header = headerSlotView?.let {
      {
        with(ComposableScope()) {
          with(it) {
            Content()
          }
        }
      }
    }
  ) {
    props.items.forEachIndexed { index, item ->
      val icon = getImageVector(item.icon)
      val alwaysShowLabel = when (props.labelVisibility) {
        "labeled" -> true
        "unlabeled", "selected" -> false
        else -> true // "auto"
      }

      NavigationRailItem(
        selected = index == props.selectedIndex,
        onClick = { onItemSelected(NavigationRailSelectedEvent(index)) },
        icon = {
          if (icon != null) {
            if (item.badge != null) {
              BadgedBox(badge = { Badge { Text(item.badge) } }) {
                Icon(imageVector = icon, contentDescription = item.label)
              }
            } else {
              Icon(imageVector = icon, contentDescription = item.label)
            }
          }
        },
        label = item.label?.let { label ->
          { Text(text = label) }
        },
        alwaysShowLabel = alwaysShowLabel
      )
    }
  }
}
