package host.exp.exponent.home

import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable

@Composable
fun <T> SeparatedList(
  items: List<T>,
  divider: @Composable () -> Unit = { HorizontalDivider() },
  renderItem: @Composable (T) -> Unit
) {
  items.forEachIndexed { index, item ->
    renderItem(item)

    // Show divider if it's not the last item in the *displayed* list
    if (index < items.lastIndex) {
      divider()
    }
  }
}
