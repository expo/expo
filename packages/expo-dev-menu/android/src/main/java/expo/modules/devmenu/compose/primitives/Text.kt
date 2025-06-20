package expo.modules.devmenu.compose.primitives

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import expo.modules.devmenu.compose.theme.FontSize
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun Text(
  text: String,
  fontSize: FontSize = Theme.typography.medium,
  color: Color? = null,
  maxLines: Int = Int.MAX_VALUE,
  softWrap: Boolean = true,
  modifier: Modifier = Modifier
) {
  BasicText(
    text,
    maxLines = maxLines,
    softWrap = softWrap,
    style = fontSize.font.merge(
      color = color ?: Theme.colors.text.default,
      fontFamily = Theme.typography.inter
    ),
    overflow = TextOverflow.Visible,
    modifier = modifier
  )
}

@Composable
fun Heading(
  text: String,
  fontSize: FontSize = Theme.typography.large,
  color: Color = Theme.colors.text.default,
  maxLines: Int = Int.MAX_VALUE
) {
  BasicText(
    text,
    maxLines = maxLines,
    style = fontSize.font.merge(
      color = color,
      fontWeight = FontWeight.SemiBold,
      fontFamily = Theme.typography.inter
    )
  )
}

@Composable
@Preview(showBackground = true)
fun TextPreview() {
  Column {
    Text("Hello, World!")
    Text("Hello, World!", fontSize = Theme.typography.size25)
  }
}

@Composable
@Preview(showBackground = true)
fun HeadingPreview() {
  Heading("Hello, World!")
}
