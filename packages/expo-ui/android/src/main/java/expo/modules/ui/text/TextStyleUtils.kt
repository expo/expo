package expo.modules.ui.text

import android.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.ui.colorToComposeColor

class TextStyleRecord : Record {
  @Field
  val fontSize: Float = 16f

  @Field
  val color: Color? = null

  @Field
  val fontWeight: String = "normal"

  @Field
  val fontStyle: String = "normal"

  @Field
  val fontFamily: String = "default"
}

fun String.toFontWeight(): FontWeight {
  return when (this.lowercase()) {
    "normal" -> FontWeight.Normal
    "bold" -> FontWeight.Bold
    "thin" -> FontWeight.Thin
    "extralight" -> FontWeight.ExtraLight
    "light" -> FontWeight.Light
    "medium" -> FontWeight.Medium
    "semibold" -> FontWeight.SemiBold
    "extrabold" -> FontWeight.ExtraBold
    "black" -> FontWeight.Black
    "100" -> FontWeight.W100
    "200" -> FontWeight.W200
    "300" -> FontWeight.W300
    "400" -> FontWeight.W400
    "500" -> FontWeight.W500
    "600" -> FontWeight.W600
    "700" -> FontWeight.W700
    "800" -> FontWeight.W800
    "900" -> FontWeight.W900
    else -> FontWeight.Normal
  }
}

fun String.toFontStyle(): FontStyle {
  return when (this.lowercase()) {
    "normal" -> FontStyle.Normal
    "italic" -> FontStyle.Italic
    else -> FontStyle.Normal
  }
}

fun String.toFontFamily(): FontFamily {
  return when (this.lowercase()) {
    "default" -> FontFamily.Default
    "cursive" -> FontFamily.Cursive
    "sans-serif" -> FontFamily.SansSerif
    "serif" -> FontFamily.Serif
    "monospace" -> FontFamily.Monospace
    else -> FontFamily.Default
  }
}

fun TextStyleRecord.toComposeTextStyle(): TextStyle {
  return TextStyle(
    color = colorToComposeColor(color),
    fontSize = fontSize.sp,
    fontWeight = fontWeight.toFontWeight(),
    fontStyle = fontStyle.toFontStyle(),
    fontFamily = fontFamily.toFontFamily()
  )
}
