package host.exp.exponent.home

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
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import host.exp.expoview.R

@Composable
fun EnterUrlRow() {
  val textFieldState = rememberTextFieldState(initialText = "")

  CollapsibleItemRow(item = { isExpanded, onClick ->
    ClickableItemRow(
      text = "Enter URL",
      onClick = onClick,
      icon = {
        Icon(
          painter = painterResource(id = R.drawable.chevron_right),
          contentDescription = "Expand or collapse",
          modifier = Modifier.size(24.dp)
        )
      }
    )
  }) {
    Column(modifier = Modifier.padding(16.dp)) {
      OutlinedTextField(
        textFieldState,
        placeholder = { Text("exp://") },
        modifier = Modifier.fillMaxWidth()
      )
      Button(
        onClick = { TODO() },
        modifier = Modifier
          .padding(top = 8.dp)
          .fillMaxWidth()
      ) {
        Text("Connect")
      }
    }
  }
}
