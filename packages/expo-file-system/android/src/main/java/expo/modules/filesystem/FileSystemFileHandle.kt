package expo.modules.filesystem

import android.content.ContentResolver
import android.net.Uri
import android.os.ParcelFileDescriptor
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.kotlin.types.Enumerable
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
import kotlin.math.min

enum class FileMode(val descriptor: String) : Enumerable {
  /** Read-only */
  READ("r"),

  /** Write-only */
  WRITE("w"),

  /** Write-only. Appends to the end. */
  APPEND("wa"),

  /** Write-only. Wipes file contents before writing. */
  TRUNCATE("wt"),

  /** Read & write. */
  READ_WRITE("rw");

  /**
   * Mode value for [RandomAccessFile] constructor.
   *
   * **Note**: [RandomAccessFile] constructor supports only `"r"` and `"rw"`.
   * Other modes like `"wa"` or `"wt"` need to be handled manually.
   */
  val rafMode: String
    get() = if (this == READ) {
      "r"
    } else {
      "rw"
    }

  fun ensureCanRead() = when (this) {
    READ, READ_WRITE -> {}
    WRITE, APPEND, TRUNCATE -> throw Exceptions.IllegalStateException("Cannot read. File opened in write-only mode.")
  }

  fun ensureCanWrite() = when (this) {
    WRITE, READ_WRITE, APPEND, TRUNCATE -> {}
    READ -> throw Exceptions.IllegalStateException("Cannot write. File opened in read-only mode.")
  }
}

class FileSystemFileHandle private constructor(
  channel: FileChannel,
  private val mode: FileMode,
  private val parcelFileDescriptor: ParcelFileDescriptor? = null,
  /**
   * `false` when the descriptor is a pipe or a socket, which a document provider may hand out for
   * an exclusive "r" or "w" mode. Positional I/O fails on those with `ESPIPE`, so reads and writes
   * fall back to sequential ones, and [size] is whatever `fstat` reports, usually 0.
   */
  private val seekable: Boolean = true
) : SharedRef<FileChannel>(channel), AutoCloseable {
  companion object {
    fun forJavaFile(file: File, mode: FileMode): FileSystemFileHandle {
      val channel = RandomAccessFile(file, mode.rafMode).channel

      if (mode == FileMode.TRUNCATE) {
        // RandomAccessFile does not handle truncate mode; wipe content manually
        channel.truncate(0)
      }
      return FileSystemFileHandle(channel, mode)
    }

    fun forContentURI(uri: Uri, mode: FileMode, contentResolver: ContentResolver): FileSystemFileHandle {
      if (mode == FileMode.READ_WRITE) {
        throw UnsupportedContentUriReadWriteException()
      }

      val pfd = contentResolver.openFileDescriptor(uri, mode.descriptor)
        ?: throw Exceptions.IllegalStateException("Could not open file descriptor for uri: $uri")

      return forParcelFileDescriptor(pfd, mode)
    }

    internal fun forParcelFileDescriptor(pfd: ParcelFileDescriptor, mode: FileMode): FileSystemFileHandle {
      val channel = when (mode) {
        FileMode.READ -> FileInputStream(pfd.fileDescriptor).channel
        FileMode.WRITE, FileMode.APPEND, FileMode.TRUNCATE -> FileOutputStream(pfd.fileDescriptor).channel
        else -> throw Exceptions.IllegalArgument("Unsupported file mode: '$mode'")
      }

      return FileSystemFileHandle(channel, mode, pfd, seekable = isSeekable(channel))
    }

    private fun isSeekable(channel: FileChannel): Boolean {
      return try {
        channel.position()
        true
      } catch (e: IOException) {
        // `lseek(2)` fails with ESPIPE on a pipe or a socket.
        false
      }
    }
  }

  private val fileChannel: FileChannel = ref

  private fun ensureIsOpen() {
    if (!fileChannel.isOpen) {
      throw UnableToReadHandleException("file handle is closed")
    }
  }

  override fun sharedObjectDidRelease() {
    close()
  }

  override fun close() {
    try {
      fileChannel.close()
    } finally {
      parcelFileDescriptor?.close()
    }
  }

  /**
   * Reads up to [length] bytes starting at [position] without touching the channel's own position.
   * Returns a direct buffer sized to the bytes actually read: shorter at the end of the file, empty
   * at or past it. Safe to call from any thread.
   *
   * On a non-seekable descriptor the position is ignored and the next bytes of the stream are
   * returned, up to [length] of them.
   */
  fun readAt(position: Long, length: Long): ByteBuffer {
    ensureIsOpen()
    mode.ensureCanRead()

    try {
      val toRead = if (seekable) {
        min(length, fileChannel.size() - position)
      } else {
        length
      }.coerceIn(0L, Int.MAX_VALUE.toLong()).toInt()
      val buffer = ByteBuffer.allocateDirect(toRead)
      var readPosition = position
      while (buffer.hasRemaining()) {
        val result = if (seekable) {
          fileChannel.read(buffer, readPosition)
        } else {
          fileChannel.read(buffer)
        }
        if (result == -1) {
          break
        }
        readPosition += result
      }
      buffer.flip()
      // `slice()` is zero-copy and bounds the capacity to the bytes read, so a file that shrank
      // between the size check and the read never hands JS a stale tail.
      return buffer.slice()
    } catch (e: Exception) {
      throw UnableToReadHandleException(e.message ?: "unknown error")
    }
  }

  /**
   * Writes [data] (from its position to its limit) at [position] and returns the offset right after
   * the written bytes. In [FileMode.APPEND] the position is ignored and the data goes to the end of
   * the file. Safe to call from any thread.
   *
   * On a non-seekable descriptor the position is ignored too: the bytes go out in call order, as
   * they did before positional writes, and the returned offset still advances by the bytes written.
   */
  fun writeAt(position: Long, data: ByteBuffer): Long {
    ensureIsOpen()
    mode.ensureCanWrite()

    try {
      if (!seekable) {
        var written = 0L
        while (data.hasRemaining()) {
          written += fileChannel.write(data)
        }
        return position + written
      }

      var writePosition = if (mode == FileMode.APPEND) {
        fileChannel.size()
      } else {
        position
      }
      while (data.hasRemaining()) {
        writePosition += fileChannel.write(data, writePosition)
      }
      return writePosition
    } catch (e: Exception) {
      throw UnableToWriteHandleException(e.message ?: "unknown error")
    }
  }

  val size: Long?
    get() = try {
      fileChannel.size()
    } catch (e: Exception) {
      null
    }
}
