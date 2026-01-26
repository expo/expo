package host.exp.exponent.home.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun AuthIndicatorScreen(
  onCancel: () -> Unit,
  modifier: Modifier = Modifier
) {
  Box(
    modifier = modifier
      .fillMaxSize(),
    contentAlignment = Alignment.Center
  ) {
    Column(
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.Center,
      modifier = Modifier.padding(32.dp)
    ) {
      CircularProgressIndicator(
        color = MaterialTheme.colorScheme.primary
      )
      Spacer(modifier = Modifier.height(24.dp))
      Text(
        text = "Authenticating in the browser...",
        style = MaterialTheme.typography.bodyLarge,
      )
      Spacer(modifier = Modifier.height(32.dp))
      Button(
        onClick = onCancel
      ) {
        Text("Cancel Login")
      }
    }
  }
}
