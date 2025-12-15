package expo.modules.devlauncher.compose.ui

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composeunstyled.TextField
import com.composeunstyled.TextInput
import expo.modules.devlauncher.compose.utils.sanitizeUrlString
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText

@Composable
fun ServerUrlInput(
  openApp: (url: String) -> Unit
) {
  var url by remember { mutableStateOf("") }
  val context = LocalContext.current

  fun connectToURL() {
    val sanitizedURL = sanitizeUrlString(url)
    if (sanitizedURL != null) {
      openApp(sanitizedURL)
      url = ""
    } else {
      Toast
        .makeText(context, "Invalid URL", Toast.LENGTH_SHORT)
        .show()
    }
  }

  Column(
    verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`)
  ) {
    TextField(
      value = url,
      onValueChange = { newUrl ->
        url = newUrl
      },
      textColor = NewAppTheme.colors.text.default,
      textStyle = NewAppTheme.font.md,
      singleLine = true,
      modifier = Modifier
        .fillMaxWidth()
        .border(
          width = 1.dp,
          shape = RoundedCornerShape(NewAppTheme.borderRadius.xl),
          color = NewAppTheme.colors.border.default
        )
        .clip(RoundedCornerShape(NewAppTheme.borderRadius.xl))
        .background(NewAppTheme.colors.background.element)
        .padding(NewAppTheme.spacing.`3`),
      keyboardOptions = KeyboardOptions(
        capitalization = KeyboardCapitalization.None,
        autoCorrectEnabled = false,
        keyboardType = KeyboardType.Uri
      ),
      keyboardActions = KeyboardActions(
        onDone = { connectToURL() }
      ),
      cursorBrush = SolidColor(NewAppTheme.colors.text.default.copy(alpha = 0.9f))
    ) {
      TextInput(
        placeholder = {
          NewText(
            text = "http://localhost:8081",
            style = NewAppTheme.font.md,
            color = NewAppTheme.colors.text.secondary
          )
        }
      )
    }

    ActionButton(
      text = "Connect",
      foreground = Color.White,
      background = Color.Black,
      modifier = Modifier.padding(vertical = NewAppTheme.spacing.`3`),
      borderRadius = NewAppTheme.borderRadius.xl,
      textStyle = NewAppTheme.font.md.merge(
        fontWeight = FontWeight.SemiBold
      ),
      onClick = { connectToURL() }
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
