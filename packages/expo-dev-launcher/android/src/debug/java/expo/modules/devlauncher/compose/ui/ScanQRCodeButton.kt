package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composeunstyled.Button
import com.composeunstyled.Icon
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.models.HomeAction
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface

@Composable
fun ScanQRCodeButton(
  onAction: (HomeAction) -> Unit = {}
) {
  RoundedSurface(
    color = NewAppTheme.colors.background.element,
    borderRadius = NewAppTheme.borderRadius.xl
  ) {
    Button(
      onClick = {
        onAction(HomeAction.ScanQRCode)
      }
    ) {
      Row(
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Companion.CenterVertically,
        modifier = Modifier.Companion
          .fillMaxWidth()
          .padding(NewAppTheme.spacing.`3`)
      ) {
        NewText(
          "Scan QR Code"
        )

        Icon(
          painter = painterResource(R.drawable.scan),
          contentDescription = "Fetch development servers icon",
          tint = NewAppTheme.colors.icon.quaternary,
          modifier = Modifier
            .size(20.dp)
        )
      }
    }
  }
}

@Preview(widthDp = 300)
@Composable
fun ScanQRCodeButtonPreview() {
  ScanQRCodeButton()
}
