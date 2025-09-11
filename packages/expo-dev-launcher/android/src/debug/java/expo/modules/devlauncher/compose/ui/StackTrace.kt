package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import expo.modules.devlauncher.compose.utils.horizontalScrollbar
import expo.modules.devlauncher.compose.utils.verticalScrollbar
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText

@Composable
fun StackTrace(
  stack: String,
  modifier: Modifier = Modifier
) {
  val verticalScrollState = rememberScrollState()
  val horizontalScrollState = rememberScrollState()
  Box(
    modifier = Modifier
      .verticalScrollbar(verticalScrollState)
      .horizontalScrollbar(horizontalScrollState)
      .then(modifier)
  ) {
    Box(
      Modifier
        .verticalScroll(verticalScrollState)
        .horizontalScroll(horizontalScrollState)

    ) {
      Box(modifier = Modifier.padding(horizontal = NewAppTheme.spacing.`4`)) {
        NewText(
          stack,
          style = TextStyle.Default.merge(
            lineHeight = 16.sp,
            fontSize = 10.sp,
            fontFamily = NewAppTheme.font.mono,
            fontWeight = FontWeight.Light
          )
        )
      }
    }
  }
}
