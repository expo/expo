package expo.modules.filesystem.unifiedfile

import android.net.Uri
import expo.modules.filesystem.fsops.DestinationSpec
import expo.modules.filesystem.fsops.CopyMoveStrategy
import expo.modules.kotlin.AppContext

interface UnifiedFileInterface {
  fun exists(): Boolean
  fun isDirectory(): Boolean
  fun isFile(): Boolean
  val parentFile: UnifiedFileInterface?
  fun createFile(mimeType: String, displayName: String): UnifiedFileInterface?
  fun createDirectory(displayName: String): UnifiedFileInterface?
  fun delete(): Boolean
  fun deleteRecursively(): Boolean
  fun listFilesAsUnified(): List<UnifiedFileInterface>
  val uri: Uri
  val type: String?
  fun lastModified(): Long?
  val creationTime: Long?
  val fileName: String?
  fun getContentUri(appContext: AppContext): Uri
  fun outputStream(append: Boolean = false): java.io.OutputStream
  fun inputStream(): java.io.InputStream
  fun length(): Long
  fun walkTopDown(): Sequence<UnifiedFileInterface>

  val copyMoveStrategy: CopyMoveStrategy
  fun copyTo(dest: DestinationSpec) = copyMoveStrategy.copyTo(dest)
  fun moveTo(dest: DestinationSpec): Uri = copyMoveStrategy.moveTo(dest)
}
