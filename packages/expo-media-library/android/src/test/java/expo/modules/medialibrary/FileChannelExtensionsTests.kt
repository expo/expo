package expo.modules.medialibrary

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
import java.nio.channels.WritableByteChannel

internal class FileChannelExtensionsTests {
  @Test
  fun `transferAllTo copies a small file in a single call`() {
    val source = mockk<FileChannel>()
    val destination = mockk<WritableByteChannel>()
    every { source.size() } returns 500L
    every { source.transferTo(0L, 500L, destination) } returns 500L

    val transferred = source.transferAllTo(destination)

    assertEquals(500L, transferred)
    verify(exactly = 1) { source.transferTo(any(), any(), destination) }
  }

  @Test
  fun `transferAllTo loops when transferTo copies at most the sendfile cap per call`() {
    // expo/expo#47767: a file above the 0x7ffff000 cap needs more than one transferTo call.
    val source = mockk<FileChannel>()
    val destination = mockk<WritableByteChannel>()
    val total = 3_000_000_000L
    val sendfileCap = 2_147_479_552L // 0x7ffff000
    every { source.size() } returns total
    every { source.transferTo(0L, total, destination) } returns sendfileCap
    every { source.transferTo(sendfileCap, total - sendfileCap, destination) } returns total - sendfileCap

    val transferred = source.transferAllTo(destination)

    assertEquals(total, transferred)
    verify(exactly = 2) { source.transferTo(any(), any(), destination) }
  }

  @Test
  fun `transferAllTo returns a short count when the transfer stalls`() {
    val source = mockk<FileChannel>()
    val destination = mockk<WritableByteChannel>()
    every { source.size() } returns 1000L
    every { source.transferTo(0L, 1000L, destination) } returns 400L
    every { source.transferTo(400L, 600L, destination) } returns 0L

    val transferred = source.transferAllTo(destination)

    assertEquals(400L, transferred)
  }

  @Test
  fun `transferAllTo copies the whole file through a channel that accepts only partial writes`() {
    // The capped destination forces the real transferTo to return partial counts (like the sendfile
    // cap does for >2 GB files), exercising the loop on a tiny file without mocks.
    val bytes = ByteArray(64 * 1024) { (it % 251).toByte() }
    val source = File.createTempFile("transferAllTo-src", ".bin").apply { writeBytes(bytes) }
    val destinationFile = File.createTempFile("transferAllTo-dst", ".bin")
    try {
      FileInputStream(source).channel.use { input ->
        FileOutputStream(destinationFile).channel.use { rawOutput ->
          val transferred = input.transferAllTo(MaxBytesPerWriteChannel(rawOutput, maxBytesPerWrite = 1000))
          assertEquals(bytes.size.toLong(), transferred)
        }
      }
      assertArrayEquals(bytes, destinationFile.readBytes())
    } finally {
      source.delete()
      destinationFile.delete()
    }
  }

  private class MaxBytesPerWriteChannel(
    private val delegate: WritableByteChannel,
    private val maxBytesPerWrite: Int
  ) : WritableByteChannel {
    override fun write(src: ByteBuffer): Int {
      val originalLimit = src.limit()
      src.limit(src.position() + minOf(maxBytesPerWrite, src.remaining()))
      val written = delegate.write(src)
      src.limit(originalLimit)
      return written
    }

    override fun isOpen(): Boolean = delegate.isOpen

    override fun close() = delegate.close()
  }
}
