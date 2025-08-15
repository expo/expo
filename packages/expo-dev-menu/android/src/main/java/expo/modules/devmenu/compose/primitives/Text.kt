package expo.modules.devmenu.compose.primitives

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.theme.FontSize
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun NewText(
  text: String,
  style: TextStyle? = null,
  color: Color = NewAppTheme.colors.text.default,
  maxLines: Int = Int.MAX_VALUE,
  softWrap: Boolean = true,
  overflow: TextOverflow = TextOverflow.Clip,
  modifier: Modifier = Modifier
) {
  BasicText(
    text,
    maxLines = maxLines,
    softWrap = softWrap,
    style = NewAppTheme.font.md.merge(
      color = color,
      fontFamily = NewAppTheme.font.inter,
      fontWeight = FontWeight.Normal
    ).merge(style),
    overflow = overflow,
    modifier = modifier
  )
}

@Composable
fun NewText(
  text: AnnotatedString,
  style: TextStyle? = null,
  color: Color = NewAppTheme.colors.text.default,
  maxLines: Int = Int.MAX_VALUE,
  softWrap: Boolean = true,
  overflow: TextOverflow = TextOverflow.Clip,
  modifier: Modifier = Modifier
) {
  BasicText(
    text,
    maxLines = maxLines,
    softWrap = softWrap,
    style = NewAppTheme.font.md.merge(
      color = color,
      fontFamily = NewAppTheme.font.inter,
      fontWeight = FontWeight.Normal
    ).merge(style),
    overflow = overflow,
    modifier = modifier
  )
}

@Composable
fun Text(
  text: String,
  fontSize: FontSize = Theme.typography.medium,
  fontWeight: FontWeight = FontWeight.Normal,
  color: Color? = null,
  maxLines: Int = Int.MAX_VALUE,
  softWrap: Boolean = true,
  textAlign: TextAlign = TextAlign.Start,
  modifier: Modifier = Modifier
) {
  BasicText(
    text,
    maxLines = maxLines,
    softWrap = softWrap,
    style = fontSize.font.merge(
      color = color ?: Theme.colors.text.default,
      fontFamily = Theme.typography.inter,
      fontWeight = fontWeight,
      textAlign = textAlign
    ),
    overflow = TextOverflow.Visible,
    modifier = modifier
  )
}

@Composable
fun Text(
  text: AnnotatedString,
  fontSize: FontSize = Theme.typography.medium,
  fontWeight: FontWeight = FontWeight.Normal,
  color: Color? = null,
  maxLines: Int = Int.MAX_VALUE,
  softWrap: Boolean = true,
  textAlign: TextAlign = TextAlign.Start,
  modifier: Modifier = Modifier
) {
  BasicText(
    text,
    maxLines = maxLines,
    softWrap = softWrap,
    style = fontSize.font.merge(
      color = color ?: Theme.colors.text.default,
      fontFamily = Theme.typography.inter,
      fontWeight = fontWeight,
      textAlign = textAlign
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
  maxLines: Int = Int.MAX_VALUE,
  overflow: TextOverflow = TextOverflow.Clip,
  modifier: Modifier = Modifier
) {
  BasicText(
    text,
    maxLines = maxLines,
    overflow = overflow,
    style = fontSize.font.merge(
      color = color,
      fontWeight = FontWeight.SemiBold,
      fontFamily = Theme.typography.inter
    ),
    modifier = modifier
  )
}

@Composable
fun Mono(
  text: String,
  fontSize: FontSize = Theme.typography.medium,
  color: Color? = null,
  maxLines: Int = Int.MAX_VALUE,
  modifier: Modifier = Modifier
) {
  BasicText(
    text,
    maxLines = maxLines,
    style = fontSize.font.merge(
      color = color ?: Theme.colors.text.default,
      fontFamily = Theme.typography.mono
    ),
    modifier = modifier
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

@Composable
@Preview(showBackground = true)
fun MonoPreview() {
  Mono("Hello, World!")
}
