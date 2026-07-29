// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Reads a font's `fvar` table to answer two questions:
 *  - [declaresVariations] — does this font vary at all?
 *  - [readWeightAxis] and [weightsFor] — which weights can it draw? These feed into
 *    [VariableTypefaces.buildInstancedFamily] and are not needed on Android 15+.
 *
 * Deliberately free of Android APIs so that it can be unit tested on the JVM.
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

  // `wght` runs from 1 to 1000. A bound outside that means we read a bad offset, not a real axis.
  private val VALID_WEIGHTS = 1..1000

  // Real fonts have a few dozen tables. This is well past anything we need to read.
  private const val MAX_TABLES = 255

  /** The most bytes [declaresVariations] reads from the start of a font. */
  const val TABLE_DIRECTORY_LIMIT = OFFSET_TABLE_SIZE + MAX_TABLES * TABLE_RECORD_SIZE

  /**
   * Whether the font starting with [prefix] has an `fvar` table, so it may vary on some axis.
   *
   * Reads at most [TABLE_DIRECTORY_LIMIT] bytes, so a caller can skip a static font before reading
   * it whole. Says `true` when [prefix] is too short to tell; [readWeightAxis] decides later.
   *
   * [prefix] is not modified, so the caller can read the rest of the font on top of it.
   */
  fun declaresVariations(prefix: ByteBuffer): Boolean {
    val font = prefix.duplicate().order(ByteOrder.BIG_ENDIAN)
    // `limit`, not `capacity`: that is what the reads below are bound by.
    if (font.limit() < OFFSET_TABLE_SIZE) {
      // Too short to be a font.
      return false
    }

    return try {
      findFvarTable(font) != null
    } catch (_: IndexOutOfBoundsException) {
      // The table directory runs past the end of [prefix], so `fvar` can't be ruled out.
      true
    }
  }

  /**
   * The values to pin a font's `wght` axis to: every weight `fontWeight` can ask for, clamped to
   * [axis]. Clamping keeps the ends — an axis stopping at 700 offers 700, not a 900 it can't draw.
   *
   * The nine fixed steps come from the pre-Android 15 API, not from the font. See
   * [VariableTypefaces.buildInstancedFamily].
   */
  fun weightsFor(axis: IntRange): List<Int> =
    (100..900 step 100).map { it.coerceIn(axis) }.distinct()

  /**
   * Returns the range of the `wght` axis declared by the font in [buffer], or `null` if it
   * declares no such axis. [buffer] is left untouched, including its position and byte order.
   */
  fun readWeightAxis(buffer: ByteBuffer): IntRange? {
    val font = buffer.duplicate().order(ByteOrder.BIG_ENDIAN)
    return try {
      val fvarOffset = findFvarTable(font) ?: return null
      readWeightAxis(font, fvarOffset)
    } catch (_: IndexOutOfBoundsException) {
      // The font is truncated or malformed. The caller loads it without variation settings.
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

    // `axisSize` may grow in later spec revisions, so extra trailing fields are fine. A record
    // smaller than what we read is not.
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
