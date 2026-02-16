package expo.modules.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.ListItem
import androidx.compose.material3.ListItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import java.io.Serializable

open class ListItemPressedEvent : Record, Serializable

data class ListItemProps(
  val headline: String = "",
  val supportingText: String? = null,
  val overlineText: String? = null,
  val leadingIcon: String? = null,
  val trailingIcon: String? = null,
  val leadingIconSize: Int = 24,
  val trailingIconSize: Int = 24,
  val containerColor: android.graphics.Color? = null,
  val headlineColor: android.graphics.Color? = null,
  val supportingColor: android.graphics.Color? = null,
  val leadingIconColor: android.graphics.Color? = null,
  val trailingIconColor: android.graphics.Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.ListItemContent(
  props: ListItemProps,
  onPress: (ListItemPressedEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)
    .clickable { onPress(ListItemPressedEvent()) }

  ListItem(
    headlineContent = {
      Text(
        text = props.headline,
        color = props.headlineColor.compose
      )
    },
    modifier = modifier,
    supportingContent = props.supportingText?.let {
      {
        Text(
          text = it,
          color = props.supportingColor.compose
        )
      }
    },
    overlineContent = props.overlineText?.let {
      { Text(text = it) }
    },
    leadingContent = props.leadingIcon?.let { iconName ->
      {
        getImageVector(iconName)?.let { imageVector ->
          Icon(
            imageVector = imageVector,
            contentDescription = iconName,
            tint = props.leadingIconColor.compose,
            modifier = Modifier.size(props.leadingIconSize.dp)
          )
        }
      }
    },
    trailingContent = props.trailingIcon?.let { iconName ->
      {
        getImageVector(iconName)?.let { imageVector ->
          Icon(
            imageVector = imageVector,
            contentDescription = iconName,
            tint = props.trailingIconColor.compose,
            modifier = Modifier.size(props.trailingIconSize.dp)
          )
        }
      }
    },
    colors = if (props.containerColor != null) {
      ListItemDefaults.colors(containerColor = props.containerColor.compose)
    } else {
      ListItemDefaults.colors()
    }
  )
}
