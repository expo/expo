package expo.modules.filesystem.next

import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedRef
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
class FileSystemFileHandle(file: FileSystemFile) : SharedRef<FileChannel>(RandomAccessFile(file.file, "rw").channel), AutoCloseable {
  private val fileChannel: FileChannel = ref

  override fun deallocate() {
    close()
  }

  override fun close() {
    fileChannel.close()
  }

  fun read(length: Int): ByteArray {
    if (!fileChannel.isOpen) {
      throw UnableToReadHandleException("file handle is closed")
    }
    try {
      val buffer = ByteBuffer.allocate(length.coerceAtMost((fileChannel.size() - fileChannel.position()).toInt()))
      fileChannel.read(buffer)
      return buffer.array()
    } catch (e: Exception) {
      throw UnableToReadHandleException(e.message ?: "unknown error")
    }
  }

  fun write(data: ByteArray) {
    if (!fileChannel.isOpen) {
      throw UnableToWriteHandleException("file handle is closed")
    }
    try {
      val buffer = ByteBuffer.wrap(data)
      fileChannel.write(buffer)
    } catch (e: Exception) {
      throw UnableToWriteHandleException(e.message ?: "unknown error")
    }
  }

  var offset: Long
    get() {
      return fileChannel.position()
    }
    set(value) {
      fileChannel.position(value)
    }

  val size: Long
    get() {
      return fileChannel.size()
    }
}
