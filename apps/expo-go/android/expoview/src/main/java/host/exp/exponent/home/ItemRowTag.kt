package host.exp.exponent.home

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ItemRowTag(
  text: String,
  modifier: Modifier = Modifier
) {
  Surface(
    shape = RoundedCornerShape(4.dp),
    color = MaterialTheme.colorScheme.background,
    modifier = modifier
  ) {
    Text(
      text = text,
      modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
      style = MaterialTheme.typography.bodySmall
    )
  }
}
