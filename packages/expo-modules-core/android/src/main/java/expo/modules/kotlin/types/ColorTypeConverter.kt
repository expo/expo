package expo.modules.kotlin.types

import android.graphics.Color
import android.os.Build
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.DynamicCastException
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.SingleType
import androidx.core.graphics.toColorInt
import com.facebook.react.bridge.ReadableArray

/**
 * Color components for named colors following the [CSS3/SVG specification](https://www.w3.org/TR/css-color-3/#svg-color)
 * and additionally the transparent color.
 */
private val namedColors = mapOf(
  "aliceblue" to arrayOf(240, 248, 255, 255),
  "antiquewhite" to arrayOf(250, 235, 215, 255),
  "aqua" to arrayOf(0, 255, 255, 255),
  "aquamarine" to arrayOf(127, 255, 212, 255),
  "azure" to arrayOf(240, 255, 255, 255),
  "beige" to arrayOf(245, 245, 220, 255),
  "bisque" to arrayOf(255, 228, 196, 255),
  "black" to arrayOf(0, 0, 0, 255),
  "blanchedalmond" to arrayOf(255, 235, 205, 255),
  "blue" to arrayOf(0, 0, 255, 255),
  "blueviolet" to arrayOf(138, 43, 226, 255),
  "brown" to arrayOf(165, 42, 42, 255),
  "burlywood" to arrayOf(222, 184, 135, 255),
  "cadetblue" to arrayOf(95, 158, 160, 255),
  "chartreuse" to arrayOf(127, 255, 0, 255),
  "chocolate" to arrayOf(210, 105, 30, 255),
  "coral" to arrayOf(255, 127, 80, 255),
  "cornflowerblue" to arrayOf(100, 149, 237, 255),
  "cornsilk" to arrayOf(255, 248, 220, 255),
  "crimson" to arrayOf(220, 20, 60, 255),
  "cyan" to arrayOf(0, 255, 255, 255),
  "darkblue" to arrayOf(0, 0, 139, 255),
  "darkcyan" to arrayOf(0, 139, 139, 255),
  "darkgoldenrod" to arrayOf(184, 134, 11, 255),
  "darkgray" to arrayOf(169, 169, 169, 255),
  "darkgreen" to arrayOf(0, 100, 0, 255),
  "darkgrey" to arrayOf(169, 169, 169, 255),
  "darkkhaki" to arrayOf(189, 183, 107, 255),
  "darkmagenta" to arrayOf(139, 0, 139, 255),
  "darkolivegreen" to arrayOf(85, 107, 47, 255),
  "darkorange" to arrayOf(255, 140, 0, 255),
  "darkorchid" to arrayOf(153, 50, 204, 255),
  "darkred" to arrayOf(139, 0, 0, 255),
  "darksalmon" to arrayOf(233, 150, 122, 255),
  "darkseagreen" to arrayOf(143, 188, 143, 255),
  "darkslateblue" to arrayOf(72, 61, 139, 255),
  "darkslategray" to arrayOf(47, 79, 79, 255),
  "darkslategrey" to arrayOf(47, 79, 79, 255),
  "darkturquoise" to arrayOf(0, 206, 209, 255),
  "darkviolet" to arrayOf(148, 0, 211, 255),
  "deeppink" to arrayOf(255, 20, 147, 255),
  "deepskyblue" to arrayOf(0, 191, 255, 255),
  "dimgray" to arrayOf(105, 105, 105, 255),
  "dimgrey" to arrayOf(105, 105, 105, 255),
  "dodgerblue" to arrayOf(30, 144, 255, 255),
  "firebrick" to arrayOf(178, 34, 34, 255),
  "floralwhite" to arrayOf(255, 250, 240, 255),
  "forestgreen" to arrayOf(34, 139, 34, 255),
  "fuchsia" to arrayOf(255, 0, 255, 255),
  "gainsboro" to arrayOf(220, 220, 220, 255),
  "ghostwhite" to arrayOf(248, 248, 255, 255),
  "gold" to arrayOf(255, 215, 0, 255),
  "goldenrod" to arrayOf(218, 165, 32, 255),
  "gray" to arrayOf(128, 128, 128, 255),
  "green" to arrayOf(0, 128, 0, 255),
  "greenyellow" to arrayOf(173, 255, 47, 255),
  "grey" to arrayOf(128, 128, 128, 255),
  "honeydew" to arrayOf(240, 255, 240, 255),
  "hotpink" to arrayOf(255, 105, 180, 255),
  "indianred" to arrayOf(205, 92, 92, 255),
  "indigo" to arrayOf(75, 0, 130, 255),
  "ivory" to arrayOf(255, 255, 240, 255),
  "khaki" to arrayOf(240, 230, 140, 255),
  "lavender" to arrayOf(230, 230, 250, 255),
  "lavenderblush" to arrayOf(255, 240, 245, 255),
  "lawngreen" to arrayOf(124, 252, 0, 255),
  "lemonchiffon" to arrayOf(255, 250, 205, 255),
  "lightblue" to arrayOf(173, 216, 230, 255),
  "lightcoral" to arrayOf(240, 128, 128, 255),
  "lightcyan" to arrayOf(224, 255, 255, 255),
  "lightgoldenrodyellow" to arrayOf(250, 250, 210, 255),
  "lightgray" to arrayOf(211, 211, 211, 255),
  "lightgreen" to arrayOf(144, 238, 144, 255),
  "lightgrey" to arrayOf(211, 211, 211, 255),
  "lightpink" to arrayOf(255, 182, 193, 255),
  "lightsalmon" to arrayOf(255, 160, 122, 255),
  "lightseagreen" to arrayOf(32, 178, 170, 255),
  "lightskyblue" to arrayOf(135, 206, 250, 255),
  "lightslategray" to arrayOf(119, 136, 153, 255),
  "lightslategrey" to arrayOf(119, 136, 153, 255),
  "lightsteelblue" to arrayOf(176, 196, 222, 255),
  "lightyellow" to arrayOf(255, 255, 224, 255),
  "lime" to arrayOf(0, 255, 0, 255),
  "limegreen" to arrayOf(50, 205, 50, 255),
  "linen" to arrayOf(250, 240, 230, 255),
  "magenta" to arrayOf(255, 0, 255, 255),
  "maroon" to arrayOf(128, 0, 0, 255),
  "mediumaquamarine" to arrayOf(102, 205, 170, 255),
  "mediumblue" to arrayOf(0, 0, 205, 255),
  "mediumorchid" to arrayOf(186, 85, 211, 255),
  "mediumpurple" to arrayOf(147, 112, 219, 255),
  "mediumseagreen" to arrayOf(60, 179, 113, 255),
  "mediumslateblue" to arrayOf(123, 104, 238, 255),
  "mediumspringgreen" to arrayOf(0, 250, 154, 255),
  "mediumturquoise" to arrayOf(72, 209, 204, 255),
  "mediumvioletred" to arrayOf(199, 21, 133, 255),
  "midnightblue" to arrayOf(25, 25, 112, 255),
  "mintcream" to arrayOf(245, 255, 250, 255),
  "mistyrose" to arrayOf(255, 228, 225, 255),
  "moccasin" to arrayOf(255, 228, 181, 255),
  "navajowhite" to arrayOf(255, 222, 173, 255),
  "navy" to arrayOf(0, 0, 128, 255),
  "oldlace" to arrayOf(253, 245, 230, 255),
  "olive" to arrayOf(128, 128, 0, 255),
  "olivedrab" to arrayOf(107, 142, 35, 255),
  "orange" to arrayOf(255, 165, 0, 255),
  "orangered" to arrayOf(255, 69, 0, 255),
  "orchid" to arrayOf(218, 112, 214, 255),
  "palegoldenrod" to arrayOf(238, 232, 170, 255),
  "palegreen" to arrayOf(152, 251, 152, 255),
  "paleturquoise" to arrayOf(175, 238, 238, 255),
  "palevioletred" to arrayOf(219, 112, 147, 255),
  "papayawhip" to arrayOf(255, 239, 213, 255),
  "peachpuff" to arrayOf(255, 218, 185, 255),
  "peru" to arrayOf(205, 133, 63, 255),
  "pink" to arrayOf(255, 192, 203, 255),
  "plum" to arrayOf(221, 160, 221, 255),
  "powderblue" to arrayOf(176, 224, 230, 255),
  "purple" to arrayOf(128, 0, 128, 255),
  "rebeccapurple" to arrayOf(102, 51, 153, 255),
  "red" to arrayOf(255, 0, 0, 255),
  "rosybrown" to arrayOf(188, 143, 143, 255),
  "royalblue" to arrayOf(65, 105, 225, 255),
  "saddlebrown" to arrayOf(139, 69, 19, 255),
  "salmon" to arrayOf(250, 128, 114, 255),
  "sandybrown" to arrayOf(244, 164, 96, 255),
  "seagreen" to arrayOf(46, 139, 87, 255),
  "seashell" to arrayOf(255, 245, 238, 255),
  "sienna" to arrayOf(160, 82, 45, 255),
  "silver" to arrayOf(192, 192, 192, 255),
  "skyblue" to arrayOf(135, 206, 235, 255),
  "slateblue" to arrayOf(106, 90, 205, 255),
  "slategray" to arrayOf(112, 128, 144, 255),
  "slategrey" to arrayOf(112, 128, 144, 255),
  "snow" to arrayOf(255, 250, 250, 255),
  "springgreen" to arrayOf(0, 255, 127, 255),
  "steelblue" to arrayOf(70, 130, 180, 255),
  "tan" to arrayOf(210, 180, 140, 255),
  "teal" to arrayOf(0, 128, 128, 255),
  "thistle" to arrayOf(216, 191, 216, 255),
  "tomato" to arrayOf(255, 99, 71, 255),
  "transparent" to arrayOf(0, 0, 0, 0),
  "turquoise" to arrayOf(64, 224, 208, 255),
  "violet" to arrayOf(238, 130, 238, 255),
  "wheat" to arrayOf(245, 222, 179, 255),
  "white" to arrayOf(255, 255, 255, 255),
  "whitesmoke" to arrayOf(245, 245, 245, 255),
  "yellow" to arrayOf(255, 255, 0, 255),
  "yellowgreen" to arrayOf(154, 205, 50, 255)
).mapValues { (_, value) ->
  value.map { it.toFloat() / 255f }
}

// region CSS color function parsing

// Matches signed/unsigned numbers with optional decimal, e.g. "255", "-120", "+0.5", ".5"
private const val NUM = """[-+]?\d*\.?\d+"""

private val rgbCommaSeparated = Regex(
  """rgba?\(\s*($NUM%?)\s*,\s*($NUM%?)\s*,\s*($NUM%?)\s*(?:,\s*($NUM%?)\s*)?\)""",
  RegexOption.IGNORE_CASE
)

private val rgbSpaceSeparated = Regex(
  """rgba?\(\s*($NUM%?)\s+($NUM%?)\s+($NUM%?)\s*(?:/\s*($NUM%?)\s*)?\)""",
  RegexOption.IGNORE_CASE
)

private val hslCommaSeparated = Regex(
  """hsla?\(\s*($NUM)\s*,\s*($NUM)%\s*,\s*($NUM)%\s*(?:,\s*($NUM%?)\s*)?\)""",
  RegexOption.IGNORE_CASE
)

private val hslSpaceSeparated = Regex(
  """hsla?\(\s*($NUM)\s+($NUM)%\s+($NUM)%\s*(?:/\s*($NUM%?)\s*)?\)""",
  RegexOption.IGNORE_CASE
)

private val hwbPattern = Regex(
  """hwb\(\s*($NUM)\s+($NUM)%\s+($NUM)%\s*(?:/\s*($NUM%?)\s*)?\)""",
  RegexOption.IGNORE_CASE
)

private val hex3 = Regex("""^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$""")
private val hex4 = Regex("""^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$""")
private val hex8 = Regex("""^#([0-9a-fA-F]{8})$""")

/**
 * Parse a color component value that can be either 0-255 integer or 0-100%.
 * Returns a float in 0..1 range.
 */
private fun parseRgbComponent(value: String): Float {
  return if (value.endsWith("%")) {
    value.dropLast(1).toFloat() / 100f
  } else {
    value.toFloat() / 255f
  }.coerceIn(0f, 1f)
}

/**
 * Parse an alpha value that can be either 0-1 float or 0-100%.
 * Returns a float in 0..1 range.
 */
private fun parseAlpha(value: String?): Float {
  if (value == null) return 1f
  return if (value.endsWith("%")) {
    value.dropLast(1).toFloat() / 100f
  } else {
    value.toFloat()
  }.coerceIn(0f, 1f)
}

private fun hueToRgb(p: Float, q: Float, t: Float): Float {
  val tt = when {
    t < 0f -> t + 1f
    t > 1f -> t - 1f
    else -> t
  }
  return when {
    tt < 1f / 6f -> p + (q - p) * 6f * tt
    tt < 1f / 2f -> q
    tt < 2f / 3f -> p + (q - p) * (2f / 3f - tt) * 6f
    else -> p
  }
}

private fun hslToColor(h: Float, s: Float, l: Float, a: Float): Color {
  val hue = ((h % 360f) + 360f) % 360f / 360f
  val r: Float
  val g: Float
  val b: Float
  if (s == 0f) {
    r = l
    g = l
    b = l
  } else {
    val q = if (l < 0.5f) l * (1f + s) else l + s - l * s
    val p = 2f * l - q
    r = hueToRgb(p, q, hue + 1f / 3f)
    g = hueToRgb(p, q, hue)
    b = hueToRgb(p, q, hue - 1f / 3f)
  }
  return Color.valueOf(r.coerceIn(0f, 1f), g.coerceIn(0f, 1f), b.coerceIn(0f, 1f), a)
}

private fun hwbToColor(h: Float, w: Float, b: Float, a: Float): Color {
  val ww = w.coerceIn(0f, 1f)
  val bb = b.coerceIn(0f, 1f)
  val sum = ww + bb
  val white = if (sum > 1f) ww / sum else ww
  val black = if (sum > 1f) bb / sum else bb
  val rgb = hslToColor(h, 1f, 0.5f, 1f)
  val r = rgb.red() * (1f - white - black) + white
  val g = rgb.green() * (1f - white - black) + white
  val bl = rgb.blue() * (1f - white - black) + white
  return Color.valueOf(r.coerceIn(0f, 1f), g.coerceIn(0f, 1f), bl.coerceIn(0f, 1f), a)
}

/**
 * Attempts to parse a CSS color function string (rgb, rgba, hsl, hsla, hwb).
 * Returns null if the string doesn't match any known CSS color function pattern.
 */
/**
 * Parses shorthand and CSS-ordered hex color strings that [toColorInt] does not handle:
 * `#RGB`, `#RGBA`, and `#RRGGBBAA` (CSS byte order where alpha is last).
 */
private fun parseHexColor(value: String): Color? {
  // #RGB → #RRGGBB
  hex3.matchEntire(value)?.let { match ->
    val r = match.groupValues[1].repeat(2).toInt(16)
    val g = match.groupValues[2].repeat(2).toInt(16)
    val b = match.groupValues[3].repeat(2).toInt(16)
    return Color.valueOf(r / 255f, g / 255f, b / 255f, 1f)
  }

  // #RGBA → #RRGGBBAA
  hex4.matchEntire(value)?.let { match ->
    val r = match.groupValues[1].repeat(2).toInt(16)
    val g = match.groupValues[2].repeat(2).toInt(16)
    val b = match.groupValues[3].repeat(2).toInt(16)
    val a = match.groupValues[4].repeat(2).toInt(16)
    return Color.valueOf(r / 255f, g / 255f, b / 255f, a / 255f)
  }

  // #RRGGBBAA (CSS byte order: alpha is last, unlike Android's #AARRGGBB)
  hex8.matchEntire(value)?.let { match ->
    val hex = match.groupValues[1].toLong(16)
    val r = ((hex shr 24) and 0xFF).toInt()
    val g = ((hex shr 16) and 0xFF).toInt()
    val b = ((hex shr 8) and 0xFF).toInt()
    val a = (hex and 0xFF).toInt()
    return Color.valueOf(r / 255f, g / 255f, b / 255f, a / 255f)
  }

  return null
}

/**
 * Parses CSS color function strings: rgb(), rgba(), hsl(), hsla(), hwb().
 */
private fun parseCssColorFunction(value: String): Color? {
  val trimmed = value.trim().lowercase()

  // rgb/rgba
  (rgbCommaSeparated.matchEntire(trimmed) ?: rgbSpaceSeparated.matchEntire(trimmed))?.let { match ->
    val r = parseRgbComponent(match.groupValues[1])
    val g = parseRgbComponent(match.groupValues[2])
    val b = parseRgbComponent(match.groupValues[3])
    val a = parseAlpha(match.groupValues[4].ifEmpty { null })
    return Color.valueOf(r, g, b, a)
  }

  // hsl/hsla
  (hslCommaSeparated.matchEntire(trimmed) ?: hslSpaceSeparated.matchEntire(trimmed))?.let { match ->
    val h = match.groupValues[1].toFloat()
    val s = match.groupValues[2].toFloat() / 100f
    val l = match.groupValues[3].toFloat() / 100f
    val a = parseAlpha(match.groupValues[4].ifEmpty { null })
    return hslToColor(h, s.coerceIn(0f, 1f), l.coerceIn(0f, 1f), a)
  }

  // hwb
  hwbPattern.matchEntire(trimmed)?.let { match ->
    val h = match.groupValues[1].toFloat()
    val w = match.groupValues[2].toFloat() / 100f
    val b = match.groupValues[3].toFloat() / 100f
    val a = parseAlpha(match.groupValues[4].ifEmpty { null })
    return hwbToColor(h, w, b, a)
  }

  return null
}

// endregion

@RequiresApi(Build.VERSION_CODES.O)
class ColorTypeConverter : DynamicAwareTypeConverters<Color>() {
  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): Color {
    return when (value.type) {
      ReadableType.Number -> colorFromInt(value.asDouble().toInt())
      ReadableType.String -> colorFromString(value.asString() ?: throw DynamicCastException(String::class))
      ReadableType.Array -> {
        val colorsArray = (value.asArray() ?: throw DynamicCastException(ReadableArray::class)).toArrayList().map { it as Double }.toDoubleArray()
        colorFromDoubleArray(colorsArray)
      }
      else -> throw UnexpectedException("Unknown argument type: ${value.type}")
    }
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): Color {
    return when (value) {
      is Int -> {
        colorFromInt(value)
      }
      is String -> {
        colorFromString(value)
      }
      is DoubleArray -> {
        colorFromDoubleArray(value)
      }
      else -> throw UnexpectedException("Unknown argument type: ${value::class}")
    }
  }

  private fun colorFromDoubleArray(value: DoubleArray): Color {
    if (value.size < 3) {
      throw InvalidColorComponentsException(value.size)
    }
    val alpha = value.getOrNull(3) ?: 1.0
    return Color.valueOf(value[0].toFloat(), value[1].toFloat(), value[2].toFloat(), alpha.toFloat())
  }

  private fun colorFromInt(value: Int): Color {
    return Color.valueOf(value)
  }

  private fun colorFromString(value: String): Color {
    val normalizedValue = value.trim().lowercase()
    val colorFromString = namedColors[normalizedValue]
    if (colorFromString != null) {
      return Color.valueOf(
        colorFromString[0],
        colorFromString[1],
        colorFromString[2],
        colorFromString[3]
      )
    }

    if (normalizedValue.startsWith('#')) {
      parseHexColor(normalizedValue)?.let { return it }
      // Fall through to toColorInt() for standard #RRGGBB / #AARRGGBB
      return Color.valueOf(normalizedValue.toColorInt())
    }

    parseCssColorFunction(normalizedValue)?.let { return it }

    return Color.valueOf(normalizedValue.toColorInt())
  }

  override fun getCppRequiredTypes(): ExpectedType =
    ExpectedType(
      SingleType(CppType.INT),
      SingleType(CppType.STRING),
      SingleType(
        CppType.PRIMITIVE_ARRAY,
        arrayOf(ExpectedType(CppType.DOUBLE))
      )
    )

  override fun isTrivial() = false
}

internal class InvalidColorComponentsException(count: Int) : CodedException(
  message = "Color components array must contain at least 3 values (red, green, blue), but got $count"
)
