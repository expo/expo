package expo.modules.devlauncher.compose.ui

import android.widget.Toast
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import com.composeunstyled.TextField
import com.composeunstyled.TextInput
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText

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

  Column(
    verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`)
  ) {
    TextField(
      value = url,
      onValueChange = { newUrl ->
        url = newUrl
      },
      textColor = NewAppTheme.colors.text.default,
      textStyle = NewAppTheme.font.sm.merge(
        fontFamily = NewAppTheme.font.mono,
        fontWeight = FontWeight.Light
      ),
      singleLine = true,
      modifier = Modifier
        .fillMaxWidth()
        .border(
          width = 1.dp,
          shape = RoundedCornerShape(NewAppTheme.borderRadius.sm),
          color = NewAppTheme.colors.border.default
        )
        .padding(NewAppTheme.spacing.`2`),
      keyboardOptions = KeyboardOptions(
        capitalization = KeyboardCapitalization.None,
        autoCorrectEnabled = false,
        keyboardType = KeyboardType.Uri
      ),
      cursorBrush = SolidColor(NewAppTheme.colors.text.default.copy(alpha = 0.9f))
    ) {
      TextInput(
        placeholder = {
          NewText(
            text = "http://localhost:8081",
            style = NewAppTheme.font.sm.merge(
              fontFamily = NewAppTheme.font.mono,
              fontWeight = FontWeight.Light
            ),
            color = NewAppTheme.colors.text.quaternary
          )
        }
      )
    }

    ActionButton(
      text = "Connect",
      foreground = Color.White,
      background = Color.Black,
      modifier = Modifier.padding(vertical = NewAppTheme.spacing.`2`),
      borderRadius = NewAppTheme.borderRadius.sm,
      textStyle = NewAppTheme.font.sm.merge(
        fontWeight = FontWeight.SemiBold
      ),
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

@Composable
@Preview(showBackground = true, widthDp = 300)
fun ServerUrlInputPreview() {
  ServerUrlInput(
    openApp = {}
  )
}
