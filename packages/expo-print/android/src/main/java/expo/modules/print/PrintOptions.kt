package expo.modules.print

import android.print.PrintAttributes.MediaSize
import io.github.expo.modules.v2.Record
import java.lang.reflect.Modifier
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

private const val MILS_PER_POINT = 1000.0 / 72

// One point. A size in whole points is at most half a point away from a standard size.
private const val STANDARD_SIZE_TOLERANCE_MILS = 14

private val standardMediaSizes: List<MediaSize> by lazy {
  MediaSize::class.java.fields
    .filter { Modifier.isStatic(it.modifiers) && it.type == MediaSize::class.java }
    .mapNotNull { it.get(null) as? MediaSize }
    .filter { it != MediaSize.UNKNOWN_PORTRAIT && it != MediaSize.UNKNOWN_LANDSCAPE }
    .map { it.asPortrait() }
}

@Record
internal data class PaperSize(
  val width: Double = 0.0,
  val height: Double = 0.0
) {
  /**
   * The print dialog selects a paper only when its size in mils equals this size, and an app cannot
   * read the papers of the printer. So the size becomes a standard size: the one that is within a
   * point of it (A4 is 8270 x 11690 mils, not whole points), or else the smallest one that contains it.
   */
  fun toPortraitMediaSize(): MediaSize? {
    if (!width.isFinite() || !height.isFinite()) {
      return null
    }
    val widthMils = (min(width, height) * MILS_PER_POINT).roundToInt()
    val heightMils = (max(width, height) * MILS_PER_POINT).roundToInt()
    if (widthMils <= 0) {
      return null
    }

    fun distance(size: MediaSize) = max(abs(size.widthMils - widthMils), abs(size.heightMils - heightMils))

    return standardMediaSizes
      .minByOrNull(::distance)
      ?.takeIf { distance(it) <= STANDARD_SIZE_TOLERANCE_MILS }
      ?: standardMediaSizes
        .filter { it.widthMils >= widthMils && it.heightMils >= heightMils }
        .minByOrNull { it.widthMils.toLong() * it.heightMils }
      ?: MediaSize("preferredPaperSize", "${width.roundToInt()} x ${height.roundToInt()}", widthMils, heightMils)
  }
}

@Record
internal data class PrintOptions(
  val html: String? = null,
  val uri: String? = null,
  val width: Int? = null,
  val height: Int? = null,
  val orientation: String? = null,
  val textZoom: Int? = null,
  val base64: Boolean = false,
  val preferredPaperSize: PaperSize? = null
)
