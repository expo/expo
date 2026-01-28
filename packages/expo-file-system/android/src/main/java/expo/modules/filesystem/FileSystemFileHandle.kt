package expo.modules.filesystem

import expo.modules.kotlin.sharedobjects.SharedRef
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
import kotlin.math.min

class FileSystemFileHandle(file: FileSystemFile) : SharedRef<FileChannel>(RandomAccessFile(file.javaFile, "rw").channel), AutoCloseable {
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
