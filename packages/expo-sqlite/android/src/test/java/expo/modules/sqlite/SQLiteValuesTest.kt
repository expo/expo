package expo.modules.sqlite

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.nio.ByteBuffer

class SQLiteValuesTest {
  @Test
  fun `an integral JavaScript number binds as a Long`() {
    assertEquals(3L, normalizeBindParam(3.0))
    assertEquals(-9_007_199_254_740_991L, normalizeBindParam(-9_007_199_254_740_991.0))
  }

  @Test
  fun `other bind values stay as they are`() {
    assertEquals(1.5, normalizeBindParam(1.5))
    assertEquals("text", normalizeBindParam("text"))
    assertNull(normalizeBindParam(null))
  }

  @Test
  fun `a blob column crosses as a ByteArray and the rest as they are`() {
    val blob = ByteBuffer.allocateDirect(3).apply {
      put(byteArrayOf(1, 2, 3))
      flip()
    }

    val values = normalizeColumnValues(listOf(blob, 7L, 1.5, "text", null))

    assertArrayEquals(byteArrayOf(1, 2, 3), values[0] as ByteArray)
    assertEquals(listOf(7L, 1.5, "text", null), values.drop(1))
  }

  @Test
  fun `open options default to what JavaScript omits`() {
    assertEquals(
      OpenDatabaseOptions(
        enableChangeListener = false,
        useNewConnection = false,
        finalizeUnusedStatementsBeforeClosing = true
      ),
      OpenDatabaseOptions()
    )
  }

  @Test
  fun `change actions cross as the values JavaScript expects`() {
    assertEquals(listOf("insert", "update", "delete", "unknown"), SQLAction.entries.map { it.value })
    assertEquals(SQLAction.INSERT, SQLAction.fromCode(18))
    assertEquals(SQLAction.UPDATE, SQLAction.fromCode(23))
    assertEquals(SQLAction.DELETE, SQLAction.fromCode(9))
    assertEquals(SQLAction.UNKNOWN, SQLAction.fromCode(0))
  }
}
