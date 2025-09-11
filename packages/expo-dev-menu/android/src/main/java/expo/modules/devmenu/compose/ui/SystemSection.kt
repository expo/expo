package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.composeunstyled.Button
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.utils.copyToClipboard

@Composable
fun SystemSection(
  appVersion: String? = null,
  runtimeVersion: String? = null,
  fullDataProvider: () -> String
) {
  Column {
    Section.Header("System")

    Spacer(NewAppTheme.spacing.`3`)

    Divider(thickness = 0.5.dp)

    Info("Version", appVersion ?: "N/A")

    Divider(thickness = 0.5.dp)

    Info("Runtime version", runtimeVersion ?: "N/A")

    Divider(thickness = 0.5.dp)

    CopyButton(fullDataProvider)
  }
}

@Composable
private fun CopyButton(fullDataProvider: () -> String) {
  val context = LocalContext.current
  Button(
    onClick = {
      copyToClipboard(
        context,
        label = "Application Info",
        text = fullDataProvider()
      )
    }
  ) {
    Row(
      horizontalArrangement = Arrangement.SpaceBetween,
      modifier = Modifier.Companion
        .fillMaxWidth()
        .padding(vertical = 12.dp)
    ) {
      NewText(
        "Copy system info",
        color = NewAppTheme.colors.text.link,
        style = NewAppTheme.font.sm
      )

      MenuIcons.Copy(
        size = 12.dp,
        tint = NewAppTheme.colors.text.link
      )
    }
  }
}

@Composable
private fun Info(label: String, value: String) {
  Row(
    horizontalArrangement = Arrangement.SpaceBetween,
    modifier = Modifier.Companion
      .fillMaxWidth()
      .padding(vertical = 12.dp)
  ) {
    NewText(
      label,
      color = NewAppTheme.colors.text.secondary
    )
    NewText(
      value,
      color = NewAppTheme.colors.text.secondary
    )
  }
}
