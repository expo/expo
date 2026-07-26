// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Reads the range of a font's `wght` variation axis out of its `fvar` table, and works out the
 * weights to instance the font at.
 *
 * Android exposes no public API for this: [android.graphics.fonts.Font.getAxes] returns the
 * variation settings a font was *built* with, not the axes it *supports*, and `FontFileUtil` is
 * hidden. Only `wght` is read, as it is the only axis `fontWeight` maps onto.
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

  // `wght` is defined to run from 1 to 1000, and `Font.Builder.setWeight` rejects anything else.
  // A bound outside that means we followed a bad offset rather than found a real axis.
  private val VALID_WEIGHTS = 1..1000

  // Real fonts declare a few dozen tables, so a directory holding this many is already well past
  // anything [declaresVariations] has to read through.
  private const val MAX_TABLES = 255

  /** The most bytes [declaresVariations] reads from the start of a font. */
  const val TABLE_DIRECTORY_LIMIT = OFFSET_TABLE_SIZE + MAX_TABLES * TABLE_RECORD_SIZE

  /**
   * Whether the font starting with [prefix] declares an `fvar` table, and so may vary on some axis.
   *
   * Reads no further than [TABLE_DIRECTORY_LIMIT] bytes, so that a caller holding a font it would
   * have to copy — one read out of the assets, say — can skip copying the static ones. Errs
   * towards `true` when [prefix] is too short to tell; [readWeightAxis] has the final say once the
   * whole font is read.
   */
  fun declaresVariations(prefix: ByteBuffer): Boolean {
    val font = prefix.duplicate().order(ByteOrder.BIG_ENDIAN)
    if (font.capacity() < OFFSET_TABLE_SIZE || font.getInt(0) !in SFNT_VERSIONS) {
      // Not something we can read at all, so there is nothing to be conservative about.
      return false
    }
    return try {
      findFvarTable(font) != null
    } catch (_: IndexOutOfBoundsException) {
      // The table directory runs past the end of the prefix, so `fvar` can't be ruled out.
      true
    }
  }

  /**
   * The weights to instance a font whose `wght` axis spans [axis] at: every weight `fontWeight` can
   * request, clamped into the range the font supports. Clamping rather than filtering keeps the
   * endpoints of a narrower axis: one that stops at 700 advertises 700 instead of claiming a 900 it
   * cannot draw.
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
      // The font is truncated or otherwise malformed. Callers then load it without variation
      // settings, which beats failing the load outright.
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

    // Later revisions of the spec may grow `axisSize`, so trailing fields we don't know about are
    // fine. A record smaller than the fields we do read is not.
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
