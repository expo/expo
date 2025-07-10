package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composables.core.Icon
import expo.modules.devmenu.R
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.Surface
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun Warning(
  text: String
) {
  Surface(
    shape = RoundedCornerShape(Theme.sizing.borderRadius.medium),
    border = BorderStroke(1.dp, Theme.colors.border.warning),
    modifier = Modifier.fillMaxWidth()
  ) {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .background(Theme.colors.background.warning)
        .padding(Theme.spacing.medium)
    ) {
      Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
          painterResource(R.drawable._expodevclientcomponents_assets_warningtriangleicon),
          contentDescription = "Warning Icon",
          tint = Theme.colors.text.warning,
          modifier = Modifier
            .size(Theme.sizing.icon.small)
            .padding(2.dp)
        )
        Spacer(Modifier.size(Theme.spacing.tiny))
        Heading("Warning", fontSize = Theme.typography.small, color = Theme.colors.text.warning)
      }
      Spacer(Modifier.size(Theme.spacing.small))

      Text(
        text,
        fontSize = Theme.typography.small,
        color = Theme.colors.text.warning
      )
    }
  }
}

@Composable
@Preview(showBackground = true, backgroundColor = 0xFFFFFFFF)
fun WarningPreview() {
  Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(16.dp)) {
    Warning(
      text = "This is a warning message. Please take caution."
    )
  }
}
