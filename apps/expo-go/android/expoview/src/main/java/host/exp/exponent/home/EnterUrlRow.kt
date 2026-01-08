package host.exp.exponent.home

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.input.rememberTextFieldState
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import host.exp.expoview.R

@Composable
fun EnterUrlRow() {
    val textFieldState = rememberTextFieldState(initialText = "")
    val uriHandler = LocalUriHandler.current

    val connect = {
        if (textFieldValue.isNotBlank()) {
            val normalized = normalizeUrl(textFieldValue)
            uriHandler.openUri(normalized)
        }
    }

    CollapsibleItemRow(item = { isExpanded, onClick ->
        ClickableItemRow(
            text = "Enter URL",
            onClick = onClick,
            icon = painterResource(id = R.drawable.chevron_right)
        )
    }) {
        Column(modifier = Modifier.padding(16.dp)) {
            OutlinedTextField(
                state = textFieldState,
                placeholder = { Text("exp://") },
                modifier = Modifier.fillMaxWidth(),
            )
            Button(
                onClick = connect,
                modifier = Modifier
                    .padding(top = 8.dp)
                    .fillMaxWidth(),
                enabled = textFieldValue.isNotBlank()
            ) {
                Text("Connect")
            }
        }
    }
}
