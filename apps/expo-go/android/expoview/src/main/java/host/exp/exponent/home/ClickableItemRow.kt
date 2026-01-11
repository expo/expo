package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.primitives.Spacer

typealias ComposableFunction = @Composable () -> Unit

@Composable
fun ClickableItemRow(
  text: String? = null,
  icon: ComposableFunction? = null,
  onClick: () -> Unit,
  action: ComposableFunction? = null,
  content: ComposableFunction? = null
) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .clickable(onClick = onClick)
      .padding(16.dp),
    verticalAlignment = Alignment.CenterVertically
  ) {
    if (icon != null) {
      icon()
      Spacer(modifier = Modifier.width(8.dp))
    }

    if (text != null) {
      Text(
        text = text,
        modifier = Modifier.weight(1f)
      )
    }

    content?.invoke()

    if (action != null) {
      Spacer(modifier = Modifier.width(8.dp))
      action()
    }
  }
}
