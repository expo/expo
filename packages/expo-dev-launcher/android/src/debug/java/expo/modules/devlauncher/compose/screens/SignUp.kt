package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composables.core.Icon
import com.composeunstyled.Button
import expo.modules.devlauncher.R
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.ButtonStyle
import expo.modules.devmenu.compose.theme.Theme

@Composable
private fun ActionButton(
  text: String,
  style: ButtonStyle,
  onClick: () -> Unit = {}
) {
  Button(
    onClick = onClick,
    shape = RoundedCornerShape(Theme.sizing.borderRadius.small),
    backgroundColor = style.background
  ) {
    Box(
      contentAlignment = Alignment.Center,
      modifier = Modifier
        .padding(vertical = Theme.spacing.small)
        .fillMaxWidth()
    ) {
      Heading(text, color = style.foreground)
    }
  }
}

@Composable
fun SignUp(
  onClose: () -> Unit = {}
) {
  Column(
    modifier = Modifier
      .padding(horizontal = 12.dp)
      .padding(top = 12.dp)
  ) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
      Heading("Account", fontSize = Theme.typography.size25)
      Button(onClick = onClose) {
        Icon(
          painterResource(R.drawable._expodevclientcomponents_assets_xicon),
          contentDescription = "Close",
          tint = Theme.colors.icon.default
        )
      }
    }

    Spacer(Theme.spacing.large)

    RoundedSurface {
      Column(modifier = Modifier.padding(Theme.spacing.small)) {
        Text(
          "Log in or create an account to view local development servers and more.",
          color = Theme.colors.text.secondary,
          fontSize = Theme.typography.small
        )

        Spacer(Theme.spacing.small)

        ActionButton(
          "Log In",
          style = Theme.colors.button.tertiary
        )

        Spacer(Theme.spacing.small)

        ActionButton(
          "Sign Up",
          style = Theme.colors.button.secondary
        )
      }
    }
  }
}

@Preview(showBackground = true)
@Composable
fun SignUpPreview() {
  SignUp()
}
