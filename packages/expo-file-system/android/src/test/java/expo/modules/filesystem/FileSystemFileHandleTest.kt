package expo.modules.filesystem

import android.os.Build
import expo.modules.kotlin.exception.Exceptions
import java.io.File
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
