package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.composeunstyled.Button
import expo.modules.devlauncher.R
import expo.modules.devmenu.compose.primitives.DayNighIcon
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun ProfileLayout(
  onClose: () -> Unit = {},
  content: @Composable () -> Unit
) {
  Column(
    modifier = Modifier
      .padding(horizontal = 12.dp)
      .padding(top = 12.dp)
  ) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
      Heading("Account", fontSize = Theme.typography.size25)
      Button(onClick = onClose) {
        DayNighIcon(
          id = R.drawable.x_icon,
          contentDescription = "Close"
        )
      }
    }

    Spacer(Theme.spacing.large)

    content()
  }
}
