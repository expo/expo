// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import java.nio.ByteBuffer
import java.nio.ByteOrder
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

private const val SFNT_VERSION_TRUETYPE = 0x00010000
private const val SFNT_VERSION_CFF = 0x4F54544F // 'OTTO'

private data class TestAxis(
  val tag: String,
  val min: Float,
  val default: Float,
  val max: Float
)

/** Encodes a value as a 16.16 fixed-point number, the format `fvar` uses for axis bounds. */
private fun fixed(value: Float): Int = Math.round(value * 65536f)

private fun fvarTable(
  axes: List<TestAxis>,
  axisSize: Int = 20,
  // Goes into the header in place of `axisSize`, to model a font declaring a record size other
  // than the one its records are actually laid out with.
  declaredAxisSize: Int = axisSize
): ByteArray {
  val axesArrayOffset = 16
  val buffer = ByteBuffer
    .allocate(axesArrayOffset + axes.size * axisSize)
    .order(ByteOrder.BIG_ENDIAN)

  buffer.putShort(1) // majorVersion
  buffer.putShort(0) // minorVersion
  buffer.putShort(axesArrayOffset.toShort())
  buffer.putShort(2) // reserved
  buffer.putShort(axes.size.toShort())
  buffer.putShort(declaredAxisSize.toShort())
  buffer.putShort(0) // instanceCount
  buffer.putShort(0) // instanceSize

  axes.forEachIndexed { index, axis ->
    buffer.position(axesArrayOffset + index * axisSize)
    buffer.put(axis.tag.toByteArray(Charsets.US_ASCII))
    buffer.putInt(fixed(axis.min))
    buffer.putInt(fixed(axis.default))
    buffer.putInt(fixed(axis.max))
    buffer.putShort(0) // flags
    buffer.putShort(0) // axisNameID
  }

  return buffer.array()
}

private fun font(
  tables: List<Pair<String, ByteArray>>,
  sfntVersion: Int = SFNT_VERSION_TRUETYPE
): ByteBuffer {
  val headerSize = 12 + tables.size * 16
  val offsets = mutableListOf<Int>()
  var cursor = headerSize
  for ((_, data) in tables) {
    offsets.add(cursor)
    cursor += (data.size + 3) / 4 * 4 // tables are 4-byte aligned
  }

  val buffer = ByteBuffer.allocate(cursor).order(ByteOrder.BIG_ENDIAN)
  buffer.putInt(sfntVersion)
  buffer.putShort(tables.size.toShort())
  buffer.putShort(0) // searchRange
  buffer.putShort(0) // entrySelector
  buffer.putShort(0) // rangeShift

  tables.forEachIndexed { index, (tag, data) ->
    buffer.put(tag.toByteArray(Charsets.US_ASCII))
    buffer.putInt(0) // checkSum
    buffer.putInt(offsets[index])
    buffer.putInt(data.size)
  }
  tables.forEachIndexed { index, (_, data) ->
    buffer.position(offsets[index])
    buffer.put(data)
  }

  buffer.position(0)
  return buffer
}

private fun weightAxis(min: Float, default: Float, max: Float) =
  listOf("fvar" to fvarTable(listOf(TestAxis("wght", min, default, max))))

/** The first [size] bytes of [font], modelling a caller that has only read that far. */
private fun prefix(font: ByteBuffer, size: Int): ByteBuffer =
  ByteBuffer.wrap(font.array().copyOf(size))

class FontVariationAxesTest {
  @Test
  fun `returns null for a static font`() {
    val static = font(listOf("glyf" to ByteArray(8), "head" to ByteArray(8)))
    assertNull(FontVariationAxes.readWeightAxis(static))
  }

  @Test
  fun `reads the weight axis range`() {
    val variable = font(weightAxis(100f, 400f, 900f))
    assertEquals(100..900, FontVariationAxes.readWeightAxis(variable))
  }

  @Test
  fun `finds the weight axis when it is not the first one`() {
    val multiAxis = listOf(
      "fvar" to fvarTable(
        listOf(
          TestAxis("wdth", 75f, 100f, 125f),
          TestAxis("opsz", 8f, 14f, 144f),
          TestAxis("wght", 200f, 400f, 800f)
        )
      )
    )
    assertEquals(200..800, FontVariationAxes.readWeightAxis(font(multiAxis)))
  }

  @Test
  fun `returns null when the font varies on other axes only`() {
    val widthOnly = listOf("fvar" to fvarTable(listOf(TestAxis("wdth", 75f, 100f, 125f))))
    assertNull(FontVariationAxes.readWeightAxis(font(widthOnly)))
  }

  @Test
  fun `reads the weight axis from a CFF font`() {
    val cff = font(weightAxis(100f, 400f, 900f), sfntVersion = SFNT_VERSION_CFF)
    assertEquals(100..900, FontVariationAxes.readWeightAxis(cff))
  }

  @Test
  fun `tolerates an axis record larger than the fields it knows`() {
    // `axisSize` is explicitly allowed to grow in future revisions of the spec.
    val padded = listOf(
      "fvar" to fvarTable(listOf(TestAxis("wght", 100f, 400f, 900f)), axisSize = 24)
    )
    assertEquals(100..900, FontVariationAxes.readWeightAxis(font(padded)))
  }

  @Test
  fun `returns null for an axis record smaller than the spec`() {
    val truncatedRecords = listOf(
      "fvar" to fvarTable(listOf(TestAxis("wght", 100f, 400f, 900f)), declaredAxisSize = 16)
    )
    assertNull(FontVariationAxes.readWeightAxis(font(truncatedRecords)))
  }

  @Test
  fun `rounds fractional axis bounds`() {
    val fractional = font(weightAxis(87.5f, 399.4f, 850.6f))
    assertEquals(88..851, FontVariationAxes.readWeightAxis(fractional))
  }

  @Test
  fun `returns null for bounds outside the range a weight axis can declare`() {
    assertNull(FontVariationAxes.readWeightAxis(font(weightAxis(0f, 400f, 2000f))))
    assertNull(FontVariationAxes.readWeightAxis(font(weightAxis(900f, 400f, 100f))))
  }

  @Test
  fun `returns null for a truncated font`() {
    val complete = font(weightAxis(100f, 400f, 900f))
    val truncated = ByteBuffer.wrap(complete.array().copyOf(complete.capacity() / 2))
    assertNull(FontVariationAxes.readWeightAxis(truncated))
  }

  @Test
  fun `returns null for an empty buffer`() {
    assertNull(FontVariationAxes.readWeightAxis(ByteBuffer.allocate(0)))
  }

  @Test
  fun `returns null for data that is not a font`() {
    val garbage = ByteBuffer.wrap(ByteArray(512) { (it * 31 % 251).toByte() })
    assertNull(FontVariationAxes.readWeightAxis(garbage))
  }

  @Test
  fun `reads a weight axis pinned to a single value`() {
    assertEquals(400..400, FontVariationAxes.readWeightAxis(font(weightAxis(400f, 400f, 400f))))
  }

  @Test
  fun `leaves the caller's buffer untouched`() {
    val variable = font(weightAxis(100f, 400f, 900f))
    variable.order(ByteOrder.LITTLE_ENDIAN).position(4)

    assertEquals(100..900, FontVariationAxes.readWeightAxis(variable))
    assertEquals(4, variable.position())
    assertEquals(ByteOrder.LITTLE_ENDIAN, variable.order())
  }
}

class DeclaresVariationsTest {
  // A table directory holding two tables, the second of which is `fvar`.
  private val tables = listOf("glyf" to ByteArray(8), "fvar" to fvarTable(listOf(TestAxis("wght", 100f, 400f, 900f))))
  private val directorySize = 12 + tables.size * 16

  @Test
  fun `is true for a variable font`() {
    assertTrue(FontVariationAxes.declaresVariations(font(tables)))
  }

  @Test
  fun `is false for a static font`() {
    val static = font(listOf("glyf" to ByteArray(8), "head" to ByteArray(8)))
    assertFalse(FontVariationAxes.declaresVariations(static))
  }

  @Test
  fun `decides from the table directory alone`() {
    // Only the directory is available, none of the tables it points at. That is the whole point:
    // the caller gets to skip reading a static font in full.
    assertTrue(FontVariationAxes.declaresVariations(prefix(font(tables), directorySize)))

    val static = font(listOf("glyf" to ByteArray(8), "head" to ByteArray(8)))
    assertFalse(FontVariationAxes.declaresVariations(prefix(static, directorySize)))
  }

  @Test
  fun `is true when the directory is cut short`() {
    // The `fvar` record falls outside the prefix, so it can't be ruled out. Erring the other way
    // would silently drop the weights of a variable font with an unusually large directory.
    val upToTheFirstRecord = directorySize - 16
    assertTrue(FontVariationAxes.declaresVariations(prefix(font(tables), upToTheFirstRecord)))
  }

  @Test
  fun `is false for data that is not a font`() {
    assertFalse(FontVariationAxes.declaresVariations(ByteBuffer.wrap(ByteArray(512) { it.toByte() })))
    assertFalse(FontVariationAxes.declaresVariations(ByteBuffer.allocate(0)))
  }

  @Test
  fun `reads no further than it advertises`() {
    assertEquals(12 + 255 * 16, FontVariationAxes.TABLE_DIRECTORY_LIMIT)
  }

  @Test
  fun `leaves the caller's buffer untouched`() {
    // `readWholeFont` reads the rest of the font on top of the prefix it was handed, so consuming
    // the prefix here would silently drop the font's first few thousand bytes.
    val prefix = font(tables)

    assertTrue(FontVariationAxes.declaresVariations(prefix))
    assertEquals(0, prefix.position())
    assertEquals(ByteOrder.BIG_ENDIAN, prefix.order())
  }
}

class WeightsForTest {
  @Test
  fun `covers every weight fontWeight can request`() {
    assertEquals(
      listOf(100, 200, 300, 400, 500, 600, 700, 800, 900),
      FontVariationAxes.weightsFor(100..900)
    )
  }

  @Test
  fun `clamps to the ends of a narrower axis rather than dropping them`() {
    // The ends are what a font declares, not the steps `fontWeight` uses, so filtering the steps
    // to the range would leave the heaviest and lightest weights the font has unreachable.
    assertEquals(
      listOf(250, 300, 400, 500, 600, 700, 800, 850),
      FontVariationAxes.weightsFor(250..850)
    )
  }

  @Test
  fun `caps at the heaviest weight the axis declares`() {
    // An axis stopping at 700 advertises 700 rather than a 900 it cannot draw.
    assertEquals(
      listOf(100, 200, 300, 400, 500, 600, 700),
      FontVariationAxes.weightsFor(100..700)
    )
  }

  @Test
  fun `collapses an axis pinned to a single weight`() {
    assertEquals(listOf(400), FontVariationAxes.weightsFor(400..400))
  }
}
