package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.ListItem
import androidx.compose.material3.ListItemDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
data class ListItemColors(
  @Field val containerColor: Color? = null,
  @Field val contentColor: Color? = null,
  @Field val leadingContentColor: Color? = null,
  @Field val trailingContentColor: Color? = null,
  @Field val supportingContentColor: Color? = null,
  @Field val overlineContentColor: Color? = null
) : Record

@OptimizedComposeProps
data class ListItemProps(
  val tonalElevation: Float? = null,
  val shadowElevation: Float? = null,
  val colors: ListItemColors? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.ListItemContent(props: ListItemProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val defaultColors = ListItemDefaults.colors()
  val colors = ListItemDefaults.colors(
    containerColor = props.colors?.containerColor.composeOrNull
      ?: defaultColors.containerColor,
    contentColor = props.colors?.contentColor.composeOrNull
      ?: defaultColors.contentColor,
    leadingContentColor = props.colors?.leadingContentColor.composeOrNull
      ?: defaultColors.leadingContentColor,
    trailingContentColor = props.colors?.trailingContentColor.composeOrNull
      ?: defaultColors.trailingContentColor,
    supportingContentColor = props.colors?.supportingContentColor.composeOrNull
      ?: defaultColors.supportingContentColor,
    overlineContentColor = props.colors?.overlineContentColor.composeOrNull
      ?: defaultColors.overlineContentColor
  )

  val headlineSlotView = findChildSlotView(view, "headlineContent")
  val overlineSlotView = findChildSlotView(view, "overlineContent")
  val supportingSlotView = findChildSlotView(view, "supportingContent")
  val leadingSlotView = findChildSlotView(view, "leadingContent")
  val trailingSlotView = findChildSlotView(view, "trailingContent")

  ListItem(
    headlineContent = {
      headlineSlotView?.let {
        with(UIComposableScope()) {
          with(it) { Content() }
        }
      }
    },
    modifier = modifier,
    overlineContent = overlineSlotView?.let {
      {
        with(UIComposableScope()) {
          with(it) { Content() }
        }
      }
    },
    supportingContent = supportingSlotView?.let {
      {
        with(UIComposableScope()) {
          with(it) { Content() }
        }
      }
    },
    leadingContent = leadingSlotView?.let {
      {
        with(UIComposableScope()) {
          with(it) { Content() }
        }
      }
    },
    trailingContent = trailingSlotView?.let {
      {
        with(UIComposableScope()) {
          with(it) { Content() }
        }
      }
    },
    colors = colors,
    tonalElevation = props.tonalElevation?.dp ?: ListItemDefaults.Elevation,
    shadowElevation = props.shadowElevation?.dp ?: ListItemDefaults.Elevation
  )
}
