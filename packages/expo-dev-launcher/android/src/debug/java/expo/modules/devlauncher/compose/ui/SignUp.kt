package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun SignUp(
  onLogIn: () -> Unit = {},
  onSignUp: () -> Unit = {}
) {
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
        style = Theme.colors.button.tertiary,
        onClick = onLogIn
      )

      Spacer(Theme.spacing.small)

      ActionButton(
        "Sign Up",
        style = Theme.colors.button.secondary,
        onClick = onSignUp
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
fun SignUpPreview() {
  SignUp()
}
