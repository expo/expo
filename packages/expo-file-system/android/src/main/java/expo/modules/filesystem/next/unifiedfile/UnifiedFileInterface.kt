package expo.modules.filesystem.next.unifiedfile

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
}
