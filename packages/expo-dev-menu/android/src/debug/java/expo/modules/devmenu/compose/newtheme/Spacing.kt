package expo.modules.devmenu.compose.newtheme

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

object Spacing {
  private val map = mapOf(
    0 to 0.dp,
    1 to 4.dp,
    2 to 8.dp,
    3 to 16.dp,
    4 to 24.dp,
    5 to 32.dp,
    6 to 40.dp,
    7 to 48.dp,
    8 to 64.dp,
    9 to 80.dp,
    10 to 96.dp,
    11 to 112.dp,
    12 to 128.dp
  )

  operator fun get(index: Int): Dp = map[index]
    ?: throw IllegalArgumentException(
      "Invalid spacing index: $index. Valid indices are: ${map.keys.joinToString(", ")}"
    )

  val `0` get() = this[0]
  val `1` get() = this[1]
  val `2` get() = this[2]
  val `3` get() = this[3]
  val `4` get() = this[4]
  val `5` get() = this[5]
  val `6` get() = this[6]
  val `7` get() = this[7]
  val `8` get() = this[8]
  val `9` get() = this[9]
  val `10` get() = this[10]
  val `11` get() = this[11]
  val `12` get() = this[12]
}
