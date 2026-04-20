package host.exp.exponent.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue

@Composable
fun CollapsibleItemRow(
  item: @Composable (isExpanded: Boolean, onClick: () -> Unit) -> Unit,
  expandedContent: @Composable () -> Unit
) {
  var isExpanded by remember { mutableStateOf(false) }

  Column {
    item(isExpanded) { isExpanded = !isExpanded }

    AnimatedVisibility(
      visible = isExpanded,
      enter = expandVertically(),
      exit = shrinkVertically()
    ) {
      expandedContent()
    }
  }
}
