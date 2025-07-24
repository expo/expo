package expo.modules.devlauncher.compose.ui

import android.widget.Toast
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.core.net.toUri
import com.composeunstyled.TextField
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.theme.Theme

private fun validateUrl(url: String): Boolean {
  return try {
    val uri = url.toUri()
    uri.scheme != null && uri.host != null
  } catch (_: Throwable) {
    false
  }
}

@Composable
fun ServerUrlInput(
  openApp: (url: String) -> Unit
) {
  var url by remember { mutableStateOf("") }
  val context = LocalContext.current

  Column {
    TextField(
      url,
      onValueChange = { newValue ->
        url = newValue
      },
      placeholder = "http://10.0.2.2:8081",
      textStyle = Theme.typography.medium.font,
      contentColor = Theme.colors.text.default,
      singleLine = true,
      modifier = Modifier
        .border(
          width = Theme.sizing.border.default,
          shape = RoundedCornerShape(Theme.sizing.borderRadius.small),
          color = Theme.colors.border.default
        )
        .padding(Theme.spacing.small),
      keyboardOptions = KeyboardOptions(
        capitalization = KeyboardCapitalization.None,
        autoCorrectEnabled = false,
        keyboardType = KeyboardType.Uri
      )
    )

    Spacer(Theme.spacing.tiny)

    ActionButton(
      text = "Connect",
      style = Theme.colors.button.tertiary,
      onClick = {
        if (validateUrl(url)) {
          openApp(url)
        } else {
          Toast
            .makeText(context, "Invalid URL", Toast.LENGTH_SHORT)
            .show()
        }
      }
    )
  }
}
