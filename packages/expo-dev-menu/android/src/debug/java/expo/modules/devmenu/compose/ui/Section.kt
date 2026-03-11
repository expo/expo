package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.clickable
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText

object Section {
  @Composable
  fun Header(text: String) {
    NewText(
      text.uppercase(),
      style = NewAppTheme.font.sm.merge(
        fontFamily = NewAppTheme.font.mono,
        fontWeight = FontWeight.Medium
      ),
      color = NewAppTheme.colors.text.quaternary
    )
  }

  @Composable
  fun Button(text: String, onClick: () -> Unit) {
    NewText(
      text.uppercase(),
      style = NewAppTheme.font.sm.merge(
        fontWeight = FontWeight.Medium,
        fontFamily = NewAppTheme.font.mono
      ),
      color = NewAppTheme.colors.text.link,
      modifier = Modifier.clickable(
        interactionSource = null,
        indication = null,
        onClick = onClick
      )
    )
  }
}
