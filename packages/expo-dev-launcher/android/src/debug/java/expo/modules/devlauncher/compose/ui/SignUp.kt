package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import expo.modules.devmenu.compose.newtheme.NewAppTheme

@Composable
fun SignUp(
  onLogIn: () -> Unit = {},
  onSignUp: () -> Unit = {}
) {
  Column(
    verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`)
  ) {
    ActionButton(
      "Login",
      foreground = Color.White,
      background = Color.Black,
      modifier = Modifier.padding(NewAppTheme.spacing.`3`),
      onClick = onLogIn
    )

    ActionButton(
      "Sign Up",
      foreground = NewAppTheme.colors.text.secondary,
      background = NewAppTheme.colors.background.element,
      modifier = Modifier.padding(NewAppTheme.spacing.`3`),
      onClick = onSignUp
    )
  }
}

@Preview(showBackground = true)
@Composable
fun SignUpPreview() {
  SignUp()
}
