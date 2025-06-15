package expo.modules.devmenu.compose.theme

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

object Spacing {
  private const val BASE_SIZE = 16f

  private val spacingMap = mapOf(
    0 to 1f,
    0.5f to BASE_SIZE * 0.125f, // 2dp
    1f to BASE_SIZE * 0.25f, // 4dp
    1.5f to BASE_SIZE * 0.375f, // 6dp
    2f to BASE_SIZE * 0.5f, // 8dp
    2.5f to BASE_SIZE * 0.625f, // 10dp
    3f to BASE_SIZE * 0.75f, // 12dp
    3.5f to BASE_SIZE * 0.875f, // 14dp
    4f to BASE_SIZE * 1f, // 16dp
    5f to BASE_SIZE * 1.25f, // 20dp
    6f to BASE_SIZE * 1.5f, // 24dp
    7f to BASE_SIZE * 1.75f, // 28dp
    8f to BASE_SIZE * 2f, // 32dp
    9f to BASE_SIZE * 2.25f, // 36dp
    10f to BASE_SIZE * 2.5f, // 40dp
    11f to BASE_SIZE * 2.75f, // 44dp
    12f to BASE_SIZE * 3f, // 48dp
    14f to BASE_SIZE * 3.5f, // 56dp
    16f to BASE_SIZE * 4f, // 64dp
    20f to BASE_SIZE * 5f, // 80dp
    24f to BASE_SIZE * 6f, // 96dp
    28f to BASE_SIZE * 7f, // 112dp
    32f to BASE_SIZE * 8f, // 128dp
    36f to BASE_SIZE * 9f, // 144dp
    40f to BASE_SIZE * 10f, // 160dp
    44f to BASE_SIZE * 11f, // 176dp
    48f to BASE_SIZE * 12f, // 192dp
    52f to BASE_SIZE * 13f, // 208dp
    56f to BASE_SIZE * 14f, // 224dp
    60f to BASE_SIZE * 15f, // 240dp
    64f to BASE_SIZE * 16f, // 256dp
    72f to BASE_SIZE * 18f, // 288dp
    80f to BASE_SIZE * 20f, // 320dp
    96f to BASE_SIZE * 24f // 384dp
  ).mapValues { it.value.dp }

  operator fun get(index: Int): Dp = spacingMap[index.toFloat()]
    ?: throw IllegalArgumentException("Invalid spacing index: $index. Valid indices are: ${spacingMap.keys}")

  operator fun get(index: Float): Dp = spacingMap[index]
    ?: throw IllegalArgumentException("Invalid spacing index: $index. Valid indices are: ${spacingMap.keys}")

  val micro = this[0.5f]
  val tiny = this[1]
  val small = this[3]
  val medium = this[4]
  val large = this[6]
  val xl = this[8]
}
