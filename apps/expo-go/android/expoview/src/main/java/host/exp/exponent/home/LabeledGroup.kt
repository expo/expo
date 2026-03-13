package host.exp.exponent.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.primitives.Spacer

@Composable
fun LabeledGroup(
  modifier: Modifier = Modifier,
  label: String? = null,
  icon: Painter? = null,
  image: Painter? = null,
  action: @Composable (() -> Unit)? = null,
  wrapWithCard: Boolean = true,
  content: @Composable ColumnScope.() -> Unit
) {
  Column(modifier = modifier.fillMaxWidth()) {
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .defaultMinSize(minHeight = 44.dp)
        .padding(start = 24.dp, end = 24.dp),
      verticalAlignment = Alignment.CenterVertically
    ) {
      if (icon != null) {
        Icon(
          painter = icon,
          contentDescription = null,
          modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
      }
      if (image != null) {
        Image(
          painter = image,
          contentDescription = null,
          modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
      }
      if (label != null) {
        Text(
          text = label,
          style = MaterialTheme.typography.titleSmall,
          modifier = Modifier.weight(1f)
        )
      }
      action?.invoke()
    }
    if (wrapWithCard) {
      Card(
        modifier = Modifier
          .fillMaxWidth()
          .padding(horizontal = 16.dp, vertical = 8.dp)
          .border(
            width = 1.dp,
            color = MaterialTheme.colorScheme.outlineVariant,
            shape = MaterialTheme.shapes.medium
          ),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
      ) {
        content()
      }
    } else {
      content()
    }
  }
}
