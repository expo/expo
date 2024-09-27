package expo.modules.filesystem.next

import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.File
import java.io.InputStream
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
class FileSystemFileHandle(file: FileSystemFile) : SharedObject() {
  val fileChannel: FileChannel

  init {
  fileChannel = file.file.inputStream().channel
  }
  fun close() {
    fileChannel.close()
  }
  fun read(length: Int): ByteArray {
    if(!fileChannel.isOpen) {
      throw UnableToReadHandleException("file handle is closed")
    }
    try {
      val buffer = ByteBuffer.allocate(length.coerceAtMost((fileChannel.size() - fileChannel.position()).toInt()));
      fileChannel.read(buffer)
      return buffer.array()
    } catch (e: Exception) {
      throw UnableToReadHandleException(e.message ?: "unknown error")
    }
  }
  fun write(data: ByteArray) {
    if(!fileChannel.isOpen) {
      throw UnableToReadHandleException("file handle is closed")
    }
    try {
      val buffer = ByteBuffer.wrap(data)
      fileChannel.write(buffer)
    } catch (e: Exception) {
      throw UnableToReadHandleException(e.message ?: "unknown error")
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