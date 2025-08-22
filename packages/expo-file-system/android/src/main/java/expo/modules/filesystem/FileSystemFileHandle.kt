package expo.modules.filesystem

import expo.modules.kotlin.sharedobjects.SharedRef
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
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

  fun read(length: Int): ByteArray {
    ensureIsOpen()
    try {
      val buffer = ByteBuffer.allocate(length.coerceAtMost((fileChannel.size() - fileChannel.position()).toInt()))
      fileChannel.read(buffer)
      return buffer.array()
    } catch (e: Exception) {
      throw UnableToReadHandleException(e.message ?: "unknown error")
    }
  }

  fun write(data: ByteArray) {
    ensureIsOpen()
    try {
      val buffer = ByteBuffer.wrap(data)
      fileChannel.write(buffer)
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
      if (value == null) {
        return
      }
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
