package expo.modules.kotlin.types

import android.graphics.Color
import android.os.Build
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.SingleType

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

@RequiresApi(Build.VERSION_CODES.O)
class ColorTypeConverter(
  isOptional: Boolean
) : DynamicAwareTypeConverters<Color>(isOptional) {
  override fun convertFromDynamic(value: Dynamic, context: AppContext?): Color {
    return when (value.type) {
      ReadableType.Number -> colorFromInt(value.asDouble().toInt())
      ReadableType.String -> colorFromString(value.asString())
      ReadableType.Array -> {
        val colorsArray = value.asArray().toArrayList().map { it as Double }.toDoubleArray()
        colorFromDoubleArray(colorsArray)
      }
      else -> throw UnexpectedException("Unknown argument type: ${value.type}")
    }
  }

  override fun convertFromAny(value: Any, context: AppContext?): Color {
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
    val alpha = value.getOrNull(3) ?: 1.0
    return Color.valueOf(value[0].toFloat(), value[1].toFloat(), value[2].toFloat(), alpha.toFloat())
  }

  private fun colorFromInt(value: Int): Color {
    return Color.valueOf(value)
  }

  private fun colorFromString(value: String): Color {
    val colorFromString = namedColors[value]
    if (colorFromString != null) {
      return Color.valueOf(
        colorFromString[0],
        colorFromString[1],
        colorFromString[2],
        colorFromString[3]
      )
    }

    return Color.valueOf(Color.parseColor(value))
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
