package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun LocalServerTutorial(isSignedIn: Boolean, onLoginClick: () -> Unit, modifier: Modifier) {
  Column(modifier = modifier) {
    if (isSignedIn) {
      Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Start a local development server with:")
        OutlinedTextField(
          "npx expo start",
          onValueChange = { },
          enabled = false,
          colors = TextFieldDefaults.colors(
            disabledContainerColor = MaterialTheme.colorScheme.background,
            disabledTextColor = MaterialTheme.colorScheme.onBackground
          )
        )
        Text("Select the local server when it appears here.")
      }
    } else {
      Text(
        "Press here to sign in to your Expo account and see the projects you have recently been working on.",
        modifier = Modifier.clickable {
          onLoginClick()
        })
    }
  }
}
