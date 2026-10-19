// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Reads a font `fvar` table to answer two questions:
 *  - [declaresVariations] — does this font vary?
 *  - [readWeightAxis] and [weightsFor] — which weights can it draw? These two functions supply
 *    [VariableTypefaces.buildInstancedFamily]. Android 15 and later do not need them.
 *
 * This object uses no Android APIs. Unit tests can therefore run it on the JVM.
 *
 * See https://learn.microsoft.com/en-us/typography/opentype/spec/fvar
 */
internal object FontVariationAxes {
  private const val TAG_FVAR = 0x66766172 // 'fvar'
  private const val TAG_WGHT = 0x77676874 // 'wght'

  private val SFNT_VERSIONS = intArrayOf(
    0x00010000, // TrueType outlines
    0x4F54544F // 'OTTO', CFF outlines
  )

  private const val OFFSET_TABLE_SIZE = 12
  private const val TABLE_RECORD_SIZE = 16
  private const val AXIS_RECORD_SIZE = 20

  // `wght` has a range of 1 to 1000. A bound outside that range shows a bad offset, not a real
  // axis.
  private val VALID_WEIGHTS = 1..1000

  // Real fonts have a few dozen tables. This limit is much larger than necessary.
  private const val MAX_TABLES = 255

  /** The maximum number of bytes that [declaresVariations] reads from the start of a font. */
  const val TABLE_DIRECTORY_LIMIT = OFFSET_TABLE_SIZE + MAX_TABLES * TABLE_RECORD_SIZE

  /**
   * `true` if the font that starts with [prefix] has an `fvar` table. Such a font can vary on an
   * axis.
   *
   * The function reads a maximum of [TABLE_DIRECTORY_LIMIT] bytes. A caller can therefore skip a
   * static font before it reads the full file. The function gives `true` if [prefix] is too short
   * for a decision. [readWeightAxis] then makes the decision.
   *
   * The function does not change [prefix]. The caller can therefore read the remainder of the font
   * after it.
   */
  fun declaresVariations(prefix: ByteBuffer): Boolean {
    val font = prefix.duplicate().order(ByteOrder.BIG_ENDIAN)
    // Use `limit`, not `capacity`. The reads below stop at `limit`.
    if (font.limit() < OFFSET_TABLE_SIZE) {
      // This is too short for a font.
      return false
    }

    return try {
      findFvarTable(font) != null
    } catch (_: IndexOutOfBoundsException) {
      // The table directory ends after [prefix]. The font can still have an `fvar` table.
      true
    }
  }

  /**
   * The `wght` values to set: every weight that `fontWeight` can request, clamped to [axis]. The
   * clamp keeps the axis ends. An axis that stops at 700 gives 700. It does not give 900, because
   * the font cannot draw 900.
   *
   * The API before Android 15 causes the nine fixed steps, not the font. See
   * [VariableTypefaces.buildInstancedFamily].
   */
  fun weightsFor(axis: IntRange): List<Int> =
    (100..900 step 100).map { it.coerceIn(axis) }.distinct()

  /**
   * The range of the `wght` axis that the font in [buffer] declares. `null` if the font declares
   * no such axis. The function does not change [buffer], its position, or its byte order.
   */
  fun readWeightAxis(buffer: ByteBuffer): IntRange? {
    val font = buffer.duplicate().order(ByteOrder.BIG_ENDIAN)
    return try {
      val fvarOffset = findFvarTable(font) ?: return null
      readWeightAxis(font, fvarOffset)
    } catch (_: IndexOutOfBoundsException) {
      // The font is truncated or has an error. The caller then loads it without variation settings.
      null
    }
  }

  /** Returns the absolute offset of the `fvar` table, or `null` if the font has none. */
  private fun findFvarTable(font: ByteBuffer): Int? {
    if (font.getInt(0) !in SFNT_VERSIONS) {
      return null
    }

    val numTables = font.getUInt16(4)
    for (index in 0 until numTables) {
      val record = OFFSET_TABLE_SIZE + index * TABLE_RECORD_SIZE
      if (font.getInt(record) == TAG_FVAR) {
        return font.getInt(record + 8)
      }
    }
    return null
  }

  private fun readWeightAxis(font: ByteBuffer, fvarOffset: Int): IntRange? {
    val axesArrayOffset = font.getUInt16(fvarOffset + 4)
    val axisCount = font.getUInt16(fvarOffset + 8)
    val axisSize = font.getUInt16(fvarOffset + 10)

    // Later revisions of the spec can increase `axisSize`. Extra fields at the end are therefore
    // correct. A record that is smaller than the fields we read is not correct.
    if (axisSize < AXIS_RECORD_SIZE) {
      return null
    }

    for (index in 0 until axisCount) {
      val record = fvarOffset + axesArrayOffset + index * axisSize
      if (font.getInt(record) != TAG_WGHT) {
        continue
      }
      val min = font.getFixed(record + 4)
      val max = font.getFixed(record + 12)
      return (min..max).takeIf { min in VALID_WEIGHTS && max in VALID_WEIGHTS && min <= max }
    }
    return null
  }

  private fun ByteBuffer.getUInt16(index: Int) = getShort(index).toInt() and 0xFFFF

  /** Reads a 16.16 fixed-point number, rounded to the nearest integer. */
  private fun ByteBuffer.getFixed(index: Int) = Math.round(getInt(index) / 65536f)
}
