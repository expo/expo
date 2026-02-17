package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.ListItem
import androidx.compose.material3.ListItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class ListItemColors(
  @Field val containerColor: Color? = null,
  @Field val headlineColor: Color? = null,
  @Field val leadingIconColor: Color? = null,
  @Field val trailingIconColor: Color? = null,
  @Field val supportingColor: Color? = null,
  @Field val overlineColor: Color? = null
) : Record

data class ListItemProps(
  val headline: String = "",
  val supportingText: String? = null,
  val overlineText: String? = null,
  val color: Color? = null,
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
    contentColor = props.colors?.headlineColor.composeOrNull
      ?: defaultColors.contentColor,
    leadingContentColor = props.colors?.leadingIconColor.composeOrNull
      ?: defaultColors.leadingContentColor,
    trailingContentColor = props.colors?.trailingIconColor.composeOrNull
      ?: defaultColors.trailingContentColor,
    supportingContentColor = props.colors?.supportingColor.composeOrNull
      ?: defaultColors.supportingContentColor,
    overlineContentColor = props.colors?.overlineColor.composeOrNull
      ?: defaultColors.overlineContentColor
  )

  val leadingSlotView = findChildSlotView(view, "leading")
  val trailingSlotView = findChildSlotView(view, "trailing")
  val supportingContentSlotView = findChildSlotView(view, "supportingContent")

  ListItem(
    headlineContent = { Text(text = props.headline) },
    modifier = modifier,
    overlineContent = props.overlineText?.let { { Text(text = it) } },
    supportingContent = supportingContentSlotView?.let {
      {
        with(ComposableScope()) {
          with(it) {
            Content()
          }
        }
      }
    } ?: props.supportingText?.let { { Text(text = it) } },
    leadingContent = leadingSlotView?.let {
      {
        with(ComposableScope()) {
          with(it) {
            Content()
          }
        }
      }
    },
    trailingContent = trailingSlotView?.let {
      {
        with(ComposableScope()) {
          with(it) {
            Content()
          }
        }
      }
    },
    colors = colors
  )
}
