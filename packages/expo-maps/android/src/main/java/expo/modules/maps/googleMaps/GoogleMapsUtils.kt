package expo.modules.maps.googleMaps

import android.graphics.Color
import com.google.android.gms.maps.model.*
import expo.modules.maps.Cap
import expo.modules.maps.Joint
import expo.modules.maps.PatternItem
import expo.modules.maps.PatternItemType
import org.json.JSONArray
import kotlin.IllegalArgumentException

fun provideDescriptor(localUri: String?, color: String?): BitmapDescriptor {
  return if (localUri != null) {
    BitmapDescriptorFactory.fromPath(localUri)
  } else if (color != null) {
    val hsv = FloatArray(3)
    Color.colorToHSV(colorStringToARGBInt(color), hsv)
    BitmapDescriptorFactory.defaultMarker(hsv.first())
  } else {
    BitmapDescriptorFactory.defaultMarker()
  }
}

fun colorHexStringToInt(hexColorString: String): Int {
  return when (hexColorString.length) {
    4 -> Color.argb(
      0xFF,
      Integer.decode("0x" + hexColorString[1] + hexColorString[1]),
      Integer.decode("0x" + hexColorString[2] + hexColorString[2]),
      Integer.decode("0x" + hexColorString[3] + hexColorString[3])
    )
    5 -> Color.argb(
      Integer.decode("0x" + hexColorString[4] + hexColorString[4]),
      Integer.decode("0x" + hexColorString[1] + hexColorString[1]),
      Integer.decode("0x" + hexColorString[2] + hexColorString[2]),
      Integer.decode("0x" + hexColorString[3] + hexColorString[3])
    )
    7 -> Color.argb(
      0xFF,
      Integer.decode("0x" + hexColorString.substring(1..2)),
      Integer.decode("0x" + hexColorString.substring(3..4)),
      Integer.decode("0x" + hexColorString.substring(5..6))
    )
    9 -> Color.argb(
      Integer.decode("0x" + hexColorString.substring(7..8)),
      Integer.decode("0x" + hexColorString.substring(1..2)),
      Integer.decode("0x" + hexColorString.substring(3..4)),
      Integer.decode("0x" + hexColorString.substring(5..6))
    )
    else -> throw IllegalArgumentException("String $hexColorString is not a valid hex color representation")
  }
}

fun colorStringToARGBInt(colorString: String): Int {
  if (colorString[0] == '#') {
    return colorHexStringToInt(colorString)
  }
  return Color.parseColor(colorString)
}

fun jointTypeStringToInt(jointTypeString: String): Int {
  val jointTypeInt: Int = if (jointTypeString.toIntOrNull() != null) {
    jointTypeString.toInt()
  } else {
    when (jointTypeString) {
      "miter" -> JointType.DEFAULT
      "bevel" -> JointType.BEVEL
      "round" -> JointType.ROUND
      else -> throw IllegalArgumentException("Illegal joint type name: $jointTypeString")
    }
  }
  return jointTypeInt
}

fun patternItemStringToGoogleMapsPatternItemList(
  patternItemsString: String
): MutableList<com.google.android.gms.maps.model.PatternItem> {
  val patternItems = mutableListOf<com.google.android.gms.maps.model.PatternItem>()

  val patternItemsJSON = JSONArray(patternItemsString)
  for (i in 0 until patternItemsJSON.length()) {
    val patternItemJSON = patternItemsJSON.getJSONObject(i)
    val patternItemType = patternItemJSON.getString("type")
    val patternItemLength = patternItemJSON.getDouble("length").toFloat()

    val patternItem = when (patternItemType) {
      "gap" -> Gap(patternItemLength)
      "stroke" -> when (patternItemLength) {
        0F -> Dot()
        else -> Dash(patternItemLength)
      }
      else -> throw IllegalArgumentException("Illegal pattern item type: $patternItemType")
    }
    patternItems.add(patternItem)
  }

  return patternItems
}

fun jointToNative(joint: Joint): Int {
  return when (joint) {
    Joint.Miter -> JointType.DEFAULT
    Joint.Bevel -> JointType.BEVEL
    Joint.Round -> JointType.ROUND
  }
}

fun capToNative(cap: Cap): com.google.android.gms.maps.model.Cap {
  return when (cap) {
    Cap.Butt -> ButtCap()
    Cap.Round -> RoundCap()
    Cap.Square -> SquareCap()
  }
}

fun patternItemToNative(patternItem: PatternItem): com.google.android.gms.maps.model.PatternItem {
  return when (patternItem.type) {
    PatternItemType.Gap -> Gap(patternItem.length)
    PatternItemType.Stroke -> when (patternItem.length) {
      0F, -0F -> Dot()
      else -> Dash(patternItem.length)
    }
  }
}
