package expo.modules.widgets.ui

import android.annotation.SuppressLint
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.background
import androidx.glance.text.FontFamily
import androidx.glance.text.FontStyle
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextDecoration
import androidx.glance.text.TextDefaults
import androidx.glance.text.TextStyle
import expo.modules.ui.TextAlignType
import expo.modules.ui.TextDecorationType
import expo.modules.ui.TextFontStyle
import expo.modules.ui.TextFontWeight
import expo.modules.ui.TextProps
import expo.modules.ui.TextSpanRecord
import expo.modules.ui.TypographyStyle
import expo.modules.ui.colorToComposeColorOrNull

@Composable
fun TextView(props: TextProps) {
  Text(
    text = props.textContent(),
    modifier = props.glanceModifier(),
    style = props.glanceTextStyle(),
    maxLines = props.maxLines ?: Int.MAX_VALUE
  )
}

private fun TextProps.textContent(): String {
  return spans?.joinToString(separator = "") { it.textContent() } ?: text
}

private fun TextSpanRecord.textContent(): String {
  return children?.joinToString(separator = "") { it.textContent() } ?: text
}

private fun TextProps.glanceModifier(): GlanceModifier {
  val backgroundColor = colorToComposeColorOrNull(background)
  val modifier = modifiers.toGlanceModifier()
  return if (backgroundColor != null) {
    modifier.background(backgroundColor)
  } else {
    modifier
  }
}

@SuppressLint("RestrictedApi")
private fun TextProps.glanceTextStyle(): TextStyle {
  val typography = typography?.glanceTypographyStyle()

  return TextStyle(
    color = colorToComposeColorOrNull(color)?.toGlanceColorProvider()
      ?: typography?.color
      ?: TextDefaults.defaultTextColor,
    fontSize = fontSize?.sp ?: typography?.fontSize,
    fontWeight = fontWeight?.toGlanceFontWeight() ?: typography?.fontWeight,
    fontStyle = fontStyle?.toGlanceFontStyle() ?: typography?.fontStyle,
    textAlign = textAlign?.toGlanceTextAlign() ?: typography?.textAlign,
    textDecoration = textDecoration?.toGlanceTextDecoration() ?: typography?.textDecoration,
    fontFamily = fontFamily.toGlanceFontFamily() ?: typography?.fontFamily
  )
}

private fun TypographyStyle.glanceTypographyStyle(): TextStyle {
  return when (this) {
    TypographyStyle.DISPLAY_LARGE -> TextStyle(fontSize = 57.sp)
    TypographyStyle.DISPLAY_MEDIUM -> TextStyle(fontSize = 45.sp)
    TypographyStyle.DISPLAY_SMALL -> TextStyle(fontSize = 36.sp)
    TypographyStyle.HEADLINE_LARGE -> TextStyle(fontSize = 32.sp)
    TypographyStyle.HEADLINE_MEDIUM -> TextStyle(fontSize = 28.sp)
    TypographyStyle.HEADLINE_SMALL -> TextStyle(fontSize = 24.sp)
    TypographyStyle.TITLE_LARGE -> TextStyle(fontSize = 22.sp)
    TypographyStyle.TITLE_MEDIUM -> TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Medium)
    TypographyStyle.TITLE_SMALL -> TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium)
    TypographyStyle.BODY_LARGE -> TextStyle(fontSize = 16.sp)
    TypographyStyle.BODY_MEDIUM -> TextStyle(fontSize = 14.sp)
    TypographyStyle.BODY_SMALL -> TextStyle(fontSize = 12.sp)
    TypographyStyle.LABEL_LARGE -> TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium)
    TypographyStyle.LABEL_MEDIUM -> TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium)
    TypographyStyle.LABEL_SMALL -> TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Medium)
  }
}

private fun TextFontWeight.toGlanceFontWeight(): FontWeight {
  return when (this) {
    TextFontWeight.NORMAL,
    TextFontWeight.W100,
    TextFontWeight.W200,
    TextFontWeight.W300,
    TextFontWeight.W400 -> FontWeight.Normal
    TextFontWeight.W500,
    TextFontWeight.W600 -> FontWeight.Medium
    TextFontWeight.BOLD,
    TextFontWeight.W700,
    TextFontWeight.W800,
    TextFontWeight.W900 -> FontWeight.Bold
  }
}

private fun TextFontStyle.toGlanceFontStyle(): FontStyle {
  return when (this) {
    TextFontStyle.NORMAL -> FontStyle.Normal
    TextFontStyle.ITALIC -> FontStyle.Italic
  }
}

private fun TextAlignType.toGlanceTextAlign(): TextAlign {
  return when (this) {
    TextAlignType.LEFT -> TextAlign.Left
    TextAlignType.RIGHT -> TextAlign.Right
    TextAlignType.CENTER -> TextAlign.Center
    TextAlignType.JUSTIFY,
    TextAlignType.START -> TextAlign.Start
    TextAlignType.END -> TextAlign.End
  }
}

private fun TextDecorationType.toGlanceTextDecoration(): TextDecoration {
  return when (this) {
    TextDecorationType.NONE -> TextDecoration.None
    TextDecorationType.UNDERLINE -> TextDecoration.Underline
    TextDecorationType.LINE_THROUGH -> TextDecoration.LineThrough
  }
}

private fun String?.toGlanceFontFamily(): FontFamily? {
  return when (this) {
    null,
    "default" -> null
    "sansSerif" -> FontFamily.SansSerif
    "serif" -> FontFamily.Serif
    "monospace" -> FontFamily.Monospace
    "cursive" -> FontFamily.Cursive
    else -> FontFamily(this)
  }
}
