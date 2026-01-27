package host.exp.exponent.home

import android.widget.Toast
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.input.rememberTextFieldState
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import host.exp.expoview.R

@Composable
fun EnterUrlRow() {
  val textFieldState = rememberTextFieldState(initialText = "")
  val uriHandler = LocalUriHandler.current
  val context = LocalContext.current

  val connect = {
    val urlText = textFieldState.text.toString()

    if (urlText.isNotBlank()) {
      val normalized = normalizeUrl(urlText)
      runCatching {
        uriHandler.openUri(normalized)
      }.onFailure {
        Toast.makeText(context, "Failed to open URL", Toast.LENGTH_SHORT).show()
      }
    }
  }

  CollapsibleItemRow(item = { isExpanded, onClick ->
    ClickableItemRow(
      text = "Enter URL",
      onClick = onClick,
      icon = {
        val rotation by animateFloatAsState(
          targetValue = if (isExpanded) 90f else 0f,
          label = "accordion-arrow"
        )
        Icon(
          painter = painterResource(id = R.drawable.chevron_right),
          contentDescription = "Enter URL icon",
          modifier = Modifier
            .size(24.dp)
            .rotate(rotation)
        )
      }
    )
  }) {
    Column(modifier = Modifier.padding(16.dp)) {
      OutlinedTextField(
        state = textFieldState,
        placeholder = { Text("exp://") },
        modifier = Modifier.fillMaxWidth()
      )
      Button(
        onClick = connect,
        modifier = Modifier
          .padding(top = 8.dp)
          .fillMaxWidth(),
        enabled = textFieldState.text.isNotBlank()
      ) {
        Text("Connect")
      }
    }
  }
}
