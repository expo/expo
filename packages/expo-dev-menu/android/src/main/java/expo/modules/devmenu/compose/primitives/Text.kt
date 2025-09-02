package expo.modules.devmenu.compose.primitives

import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import expo.modules.devmenu.compose.newtheme.NewAppTheme

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
