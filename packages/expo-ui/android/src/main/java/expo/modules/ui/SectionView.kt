package expo.modules.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import java.io.Serializable

open class IsExpandedChangeEvent(
  @Field open val isExpanded: Boolean = false
) : Record, Serializable

data class SectionProps(
  val title: String? = null,
  val isExpanded: Boolean = true,
  val containerColor: android.graphics.Color? = null,
  val titleColor: android.graphics.Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SectionContent(
  props: SectionProps,
  onIsExpandedChange: (IsExpandedChangeEvent) -> Unit
) {
  val hasTitle = !props.title.isNullOrEmpty()
  val expandIcon = getImageVector(if (props.isExpanded) "filled.KeyboardArrowUp" else "filled.KeyboardArrowDown")

  ElevatedCard(
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)
      .fillMaxWidth(),
    colors = if (props.containerColor != null) {
      CardDefaults.elevatedCardColors(
        containerColor = props.containerColor.compose
      )
    } else {
      CardDefaults.elevatedCardColors()
    }
  ) {
    Column {
      if (hasTitle) {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .clickable { onIsExpandedChange(IsExpandedChangeEvent(!props.isExpanded)) }
            .padding(horizontal = 16.dp, vertical = 12.dp),
          verticalAlignment = Alignment.CenterVertically
        ) {
          Text(
            text = props.title!!,
            style = MaterialTheme.typography.titleMedium,
            color = props.titleColor.compose,
            modifier = Modifier.weight(1f)
          )
          expandIcon?.let {
            Icon(
              imageVector = it,
              contentDescription = if (props.isExpanded) "Collapse" else "Expand",
              modifier = Modifier.size(24.dp)
            )
          }
        }
      }

      AnimatedVisibility(
        visible = props.isExpanded,
        enter = expandVertically(),
        exit = shrinkVertically()
      ) {
        Column {
          Children(ComposableScope())
        }
      }
    }
  }
}
