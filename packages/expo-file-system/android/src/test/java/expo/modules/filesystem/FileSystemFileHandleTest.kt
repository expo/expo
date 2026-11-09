package expo.modules.filesystem

import android.os.Build
import android.os.ParcelFileDescriptor
import expo.modules.kotlin.exception.Exceptions
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.nio.ByteBuffer
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.R])
class FileSystemFileHandleTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  private fun file(contents: String): File {
    val file = temporaryFolder.newFile()
    file.writeText(contents)
    return file
  }

  private fun bytes(contents: String): ByteBuffer {
    val encoded = contents.toByteArray()
    return ByteBuffer.allocateDirect(encoded.size).put(encoded).apply { flip() }
  }

  private fun ByteBuffer.asString(): String {
    val array = ByteArray(remaining())
    duplicate().get(array)
    return String(array)
  }

  @Test
  fun readAtReturnsBytesFromPositionAndStopsAtEof() {
    val handle = FileSystemFileHandle.forJavaFile(file("abcdef"), FileMode.READ)

    assertEquals("ef", handle.readAt(4, 10).asString())
    assertEquals(0, handle.readAt(6, 1).remaining())
    assertEquals(0, handle.readAt(10, 1).remaining())
  }

  @Test
  fun readAtDoesNotKeepACursor() {
    val handle = FileSystemFileHandle.forJavaFile(file("abcdef"), FileMode.READ)

    assertEquals("ab", handle.readAt(0, 2).asString())
    assertEquals("ab", handle.readAt(0, 2).asString())
  }

  @Test
  fun writeAtWritesAtPositionAndReturnsEndOffset() {
    val target = file("abcdef")
    val handle = FileSystemFileHandle.forJavaFile(target, FileMode.READ_WRITE)

    assertEquals(4L, handle.writeAt(2, bytes("XY")))
    handle.close()
    assertEquals("abXYef", target.readText())
  }

  @Test
  fun writeAtPastEofGrowsTheFile() {
    val handle = FileSystemFileHandle.forJavaFile(file("abc"), FileMode.READ_WRITE)

    assertEquals(6L, handle.writeAt(5, bytes("Z")))
    assertEquals(6L, handle.size)
    val gap = handle.readAt(3, 2)
    assertArrayEquals(byteArrayOf(0, 0), ByteArray(2).also { gap.get(it) })
  }

  @Test
  fun appendModeIgnoresThePosition() {
    val target = file("abc")
    val handle = FileSystemFileHandle.forJavaFile(target, FileMode.APPEND)

    assertEquals(4L, handle.writeAt(0, bytes("d")))
    handle.close()
    assertEquals("abcd", target.readText())
  }

  @Test
  fun truncateModeWipesTheFileOnOpen() {
    val handle = FileSystemFileHandle.forJavaFile(file("abc"), FileMode.TRUNCATE)

    assertEquals(0L, handle.size)
  }

  @Test
  fun readAtThrowsInWriteOnlyMode() {
    val handle = FileSystemFileHandle.forJavaFile(file("abc"), FileMode.WRITE)

    // Same exception the cursor-based read() throws today for a mode violation.
    assertThrows(Exceptions.IllegalStateException::class.java) {
      handle.readAt(0, 1)
    }
  }

  @Test
  fun writeAtThrowsInReadOnlyMode() {
    val handle = FileSystemFileHandle.forJavaFile(file("abc"), FileMode.READ)

    assertThrows(Exceptions.IllegalStateException::class.java) {
      handle.writeAt(0, bytes("x"))
    }
  }

  /**
   * A FIFO is a real pipe to the kernel, so `lseek(2)` fails on it with ESPIPE. Robolectric backs
   * `ParcelFileDescriptor.createPipe()` with a regular file, which would not catch the bug.
   * Returns the write end, opened read-write so that it does not block, and the read end.
   */
  private fun pipe(): Pair<ParcelFileDescriptor, ParcelFileDescriptor> {
    val fifo = File(temporaryFolder.root, "fifo")
    assertEquals(0, ProcessBuilder("mkfifo", fifo.path).inheritIO().start().waitFor())
    val writeEnd = ParcelFileDescriptor.open(fifo, ParcelFileDescriptor.MODE_READ_WRITE)
    // Proves the fixture: `lseek` fails on the descriptor, as it does on a provider's pipe.
    assertThrows(IOException::class.java) {
      FileOutputStream(writeEnd.fileDescriptor).channel.position()
    }
    val readEnd = ParcelFileDescriptor.open(fifo, ParcelFileDescriptor.MODE_READ_ONLY)
    return writeEnd to readEnd
  }

  // A document provider may back an exclusive "r" or "w" descriptor with a pipe. Positional I/O
  // fails on it with ESPIPE, so the handle has to fall back to sequential reads and writes there.
  @Test
  fun writeAtOnAPipeWritesSequentially() {
    val (writeEnd, readEnd) = pipe()
    val handle = FileSystemFileHandle.forParcelFileDescriptor(writeEnd, FileMode.WRITE)

    assertEquals(5L, handle.writeAt(0, bytes("hello")))
    assertEquals(6L, handle.writeAt(5, bytes("!")))
    handle.close()

    val received = ParcelFileDescriptor.AutoCloseInputStream(readEnd).use { it.readBytes() }
    assertEquals("hello!", String(received))
  }

  @Test
  fun appendModeOnAPipeWritesSequentially() {
    val (writeEnd, readEnd) = pipe()
    val handle = FileSystemFileHandle.forParcelFileDescriptor(writeEnd, FileMode.APPEND)

    assertEquals(2L, handle.writeAt(0, bytes("ab")))
    assertEquals(4L, handle.writeAt(2, bytes("cd")))
    handle.close()

    val received = ParcelFileDescriptor.AutoCloseInputStream(readEnd).use { it.readBytes() }
    assertEquals("abcd", String(received))
  }

  @Test
  fun readAtOnAPipeReadsSequentially() {
    val (writeEnd, readEnd) = pipe()
    ParcelFileDescriptor.AutoCloseOutputStream(writeEnd).use { it.write("hello".toByteArray()) }
    val handle = FileSystemFileHandle.forParcelFileDescriptor(readEnd, FileMode.READ)

    assertEquals("hel", handle.readAt(0, 3).asString())
    // The position is ignored: the stream continues where the last read stopped, then hits EOF.
    assertEquals("lo", handle.readAt(0, 10).asString())
    assertEquals(0, handle.readAt(0, 10).remaining())
  }

  @Test
  fun readIntoFillsTheBufferAndReturnsTheCount() {
    val handle = FileSystemFileHandle.forJavaFile(file("abcdef"), FileMode.READ)
    val target = ByteBuffer.allocateDirect(4)

    assertEquals(4, handle.readInto(2, target))
    target.flip()
    assertEquals("cdef", target.asString())
  }

  @Test
  fun readIntoHonorsThePositionAndLimitOfTheBuffer() {
    val handle = FileSystemFileHandle.forJavaFile(file("abcdef"), FileMode.READ)
    val target = ByteBuffer.allocateDirect(8).apply {
      put(ByteArray(8) { 0x2A })
      position(2)
      limit(6)
    }

    assertEquals(4, handle.readInto(0, target))
    assertEquals(6, target.position())
    target.clear()
    assertEquals("**abcd**", target.asString())
  }

  @Test
  fun readIntoStopsAtEof() {
    val handle = FileSystemFileHandle.forJavaFile(file("abcdef"), FileMode.READ)

    assertEquals(2, handle.readInto(4, ByteBuffer.allocateDirect(10)))
    assertEquals(0, handle.readInto(6, ByteBuffer.allocateDirect(10)))
    assertEquals(0, handle.readInto(10, ByteBuffer.allocateDirect(10)))
    assertEquals(0, handle.readInto(0, ByteBuffer.allocateDirect(0)))
  }

  @Test
  fun readIntoRejectsANegativePosition() {
    val handle = FileSystemFileHandle.forJavaFile(file("abc"), FileMode.READ)

    assertThrows(UnableToReadHandleException::class.java) {
      handle.readInto(-1, ByteBuffer.allocateDirect(1))
    }
  }

  @Test
  fun readIntoThrowsInWriteOnlyMode() {
    val handle = FileSystemFileHandle.forJavaFile(file("abc"), FileMode.WRITE)

    assertThrows(Exceptions.IllegalStateException::class.java) {
      handle.readInto(0, ByteBuffer.allocateDirect(1))
    }
  }

  @Test
  fun readIntoOnAPipeReadsSequentially() {
    val (writeEnd, readEnd) = pipe()
    ParcelFileDescriptor.AutoCloseOutputStream(writeEnd).use { it.write("hello".toByteArray()) }
    val handle = FileSystemFileHandle.forParcelFileDescriptor(readEnd, FileMode.READ)
    val target = ByteBuffer.allocateDirect(3)

    assertEquals(3, handle.readInto(0, target))
    target.flip()
    assertEquals("hel", target.asString())
    assertEquals(2, handle.readInto(0, ByteBuffer.allocateDirect(10)))
  }

  @Test
  fun closedHandleRejectsReadsAndReportsNullSize() {
    val handle = FileSystemFileHandle.forJavaFile(file("abc"), FileMode.READ)

    handle.close()
    handle.close()
    assertThrows(UnableToReadHandleException::class.java) {
      handle.readAt(0, 1)
    }
    assertNull(handle.size)
  }
}
