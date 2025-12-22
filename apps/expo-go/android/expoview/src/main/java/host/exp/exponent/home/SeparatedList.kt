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
fun <T> SeparatedList(
    items: List<T>,
    renderItem: @Composable (T) -> Unit
) {


    items.forEachIndexed { index, item ->
        renderItem(item)

        // Show divider if it's not the last item in the *displayed* list
        if (index < items.lastIndex) {
            HorizontalDivider()
        }
    }
}