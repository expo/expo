package host.exp.exponent.home

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable

@Composable
fun SmallActionButton(
  label: String,
  onClick: () -> Unit
) {
  TextButton(onClick = onClick) {
    Text(
      text = label,
      style = MaterialTheme.typography.labelMedium,
      color = MaterialTheme.colorScheme.primary
    )
  }
}
