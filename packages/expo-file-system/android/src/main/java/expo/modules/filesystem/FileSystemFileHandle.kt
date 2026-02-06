package expo.modules.filesystem

import android.content.ContentResolver
import android.net.Uri
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.sharedobjects.SharedRef
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
import kotlin.math.min

private enum class FileMode(val descriptor: String) {
  READ("r"),
  WRITE("w"),
  READ_WRITE("rw");

  fun ensureCanRead() = when (this) {
    READ, READ_WRITE -> {}
    WRITE -> throw Exceptions.IllegalStateException("Cannot read. File opened in write-only mode.")
  }

  fun ensureCanWrite() = when (this) {
    WRITE, READ_WRITE -> {}
    READ -> throw Exceptions.IllegalStateException("Cannot write. File opened in read-only mode.")
  }

  companion object {
    fun fromString(mode: String): FileMode =
      entries.find { it.descriptor == mode } ?: throw Exceptions.IllegalArgument("Invalid file mode: $mode")
  }
}

class FileSystemFileHandle private constructor(
  channel: FileChannel,
  private val mode: FileMode
) : SharedRef<FileChannel>(channel), AutoCloseable {
  companion object {
    fun forJavaFile(file: File, mode: String = "rw"): FileSystemFileHandle {
      val fileMode = FileMode.fromString(mode)
      val channel = RandomAccessFile(file, fileMode.descriptor).channel
      return FileSystemFileHandle(channel, fileMode)
    }

    fun forContentURI(uri: Uri, mode: String, contentResolver: ContentResolver): FileSystemFileHandle {
      val fileMode = FileMode.fromString(mode)

      val pfd = contentResolver.openFileDescriptor(uri, fileMode.descriptor)
        ?: throw Exceptions.IllegalStateException("Could not open file descriptor for uri: $uri")

      val channel = when (fileMode) {
        FileMode.READ -> FileInputStream(pfd.fileDescriptor).channel
        FileMode.WRITE -> FileOutputStream(pfd.fileDescriptor).channel
        else -> throw Exceptions.IllegalArgument("Unsupported file mode: '$mode'")
      }

      return FileSystemFileHandle(channel, fileMode)
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
    fileChannel.close()
  }

  fun read(length: Long): ByteArray {
    ensureIsOpen()
    mode.ensureCanRead()

    try {
      val currentPosition = fileChannel.position()
      val totalSize = fileChannel.size()
      val available = totalSize - currentPosition
      val readAmount = min(length, available).coerceAtMost(Int.MAX_VALUE.toLong()).toInt()

      if (readAmount <= 0) {
        return ByteArray(0)
      }

      val buffer = ByteBuffer.allocate(readAmount)
      var bytesRead = 0
      while (bytesRead < readAmount) {
        val result = fileChannel.read(buffer)
        if (result == -1) break
        bytesRead += result
      }

      return buffer.array()
    } catch (e: Exception) {
      throw UnableToReadHandleException(e.message ?: "unknown error")
    }
  }

  fun write(data: ByteArray) {
    ensureIsOpen()
    mode.ensureCanWrite()

    try {
      val buffer = ByteBuffer.wrap(data)
      while (buffer.hasRemaining()) {
        fileChannel.write(buffer)
      }
    } catch (e: Exception) {
      throw UnableToWriteHandleException(e.message ?: "unknown error")
    }
  }

  var offset: Long?
    get() {
      return try {
        fileChannel.position()
      } catch (e: Exception) {
        null
      }
    }
    set(value) {
      if (value == null) return
      fileChannel.position(value)
    }

  val size: Long?
    get() {
      return try {
        fileChannel.size()
      } catch (e: Exception) {
        null
      }
    }
}
