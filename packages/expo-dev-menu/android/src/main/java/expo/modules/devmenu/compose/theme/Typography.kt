package expo.modules.devmenu.compose.theme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import expo.modules.devmenu.R

private const val BASE_FONT_SIZE = 16f

@JvmInline
value class FontSize(val font: TextStyle) {
  companion object {
    internal fun create(
      fontSize: Int,
      lineHeightFactor: Int,
      letterSpacingFactor: Float? = null
    ): FontSize {
      return FontSize(
        TextStyle(
          fontSize = fontSize.sp,
          lineHeight = (lineHeightFactor.toFloat() / fontSize.toFloat()).em,
          letterSpacing = letterSpacingFactor?.let { it * BASE_FONT_SIZE }?.sp
            ?: TextUnit.Unspecified
        )
      )
    }
  }
}

object Typography {
  val size12 = FontSize.create(12, 19)
  val size13 = FontSize.create(13, 21, -0.003f)
  val size14 = FontSize.create(14, 22, -0.006f)
  val size15 = FontSize.create(15, 24, -0.009f)
  val size16 = FontSize.create(16, 26, -0.011f)
  val size18 = FontSize.create(18, 28, -0.014f)
  val size19 = FontSize.create(19, 29, -0.015f)
  val size20 = FontSize.create(20, 30, -0.017f)
  val size22 = FontSize.create(22, 31, -0.018f)
  val size23 = FontSize.create(23, 32, -0.019f)
  val size25 = FontSize.create(25, 35, -0.021f)
  val size27 = FontSize.create(27, 36, -0.021f)
  val size29 = FontSize.create(29, 38, -0.021f)
  val size31 = FontSize.create(31, 40, -0.021f)
  val size34 = FontSize.create(34, 44, -0.022f)
  val size37 = FontSize.create(37, 48, -0.022f)
  val size39 = FontSize.create(39, 51, -0.022f)
  val size43 = FontSize.create(43, 52, -0.022f)
  val size46 = FontSize.create(46, 55, -0.022f)
  val size49 = FontSize.create(49, 59, -0.022f)
  val size53 = FontSize.create(53, 64, -0.022f)
  val size61 = FontSize.create(61, 73, -0.022f)

  val small = size12
  val medium = size16
  val large = size18

  val inter = FontFamily(
    Font(R.font.inter_regular, FontWeight.Normal),
    Font(R.font.inter_semibold, FontWeight.SemiBold)
  )
}
