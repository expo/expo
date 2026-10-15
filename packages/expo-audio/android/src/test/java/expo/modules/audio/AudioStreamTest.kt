package expo.modules.audio

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.nio.ByteBuffer
import java.nio.ByteOrder

class AudioStreamTest {
  @Test
  fun shortReadShrinksCapacityToBytesRead() {
    val buffer = ByteBuffer.allocateDirect(3200).order(ByteOrder.nativeOrder())
    val written = byteArrayOf(1, 2, 3, 4, 5, 6, 7, 8)
    buffer.duplicate().put(written)

    val recorded = trimToRecordedBytes(buffer, written.size)

    assertEquals(written.size, recorded.capacity())
    assertTrue(recorded.isDirect)
    assertArrayEquals(written, ByteArray(written.size).also { recorded.duplicate().get(it) })
  }

  @Test
  fun fullReadKeepsCapacity() {
    val buffer = ByteBuffer.allocateDirect(3200).order(ByteOrder.nativeOrder())

    val recorded = trimToRecordedBytes(buffer, 3200)

    assertEquals(3200, recorded.capacity())
    assertTrue(recorded.isDirect)
  }
}
