package expo.modules.filesystem.unifiedfile

import android.net.Uri

interface UnifiedFileInterface {
  fun exists(): Boolean
  fun isDirectory(): Boolean
  fun isFile(): Boolean
  val parentFile: UnifiedFileInterface?
  fun createFile(mimeType: String, displayName: String): UnifiedFileInterface?
  fun createDirectory(displayName: String): UnifiedFileInterface?
  fun delete(): Boolean
  fun listFilesAsUnified(): List<UnifiedFileInterface>
  val uri: Uri
  val type: String?
  fun lastModified(): Long?
  val creationTime: Long?
  val fileName: String?
  fun outputStream(): java.io.OutputStream
  fun inputStream(): java.io.InputStream
  fun length(): Long
  fun walkTopDown(): Sequence<UnifiedFileInterface>
}
