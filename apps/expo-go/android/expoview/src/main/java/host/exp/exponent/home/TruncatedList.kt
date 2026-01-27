package host.exp.exponent.home

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun <T> TruncatedList(
  items: List<T>,
  maxItems: Int = 3,
  showMoreText: String = "View All",
  onShowMoreClick: () -> Unit,
  renderItem: @Composable (T) -> Unit
) {
  val displayItems = items.take(maxItems)

  displayItems.forEachIndexed { index, item ->
    renderItem(item)

    if (index < displayItems.lastIndex) {
      HorizontalDivider()
    }
  }

  if (items.size > maxItems) {
    HorizontalDivider()
    TextButton(
      onClick = onShowMoreClick,
      modifier = Modifier
        .fillMaxWidth()
        .padding(vertical = 4.dp)
    ) {
      Text(showMoreText)
    }
  }
}
