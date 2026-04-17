package expo.modules.filesystem.unifiedfile

import android.net.Uri
import android.os.ParcelFileDescriptor
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

  /**
   * Opens a [ParcelFileDescriptor] for this file.
   * Returns `null` if the backend does not support file descriptors.
   *
   * @param mode "r" for read, "w" for write (follows ContentResolver conventions)
   */
  fun openFileDescriptor(mode: String): ParcelFileDescriptor? = null

  fun length(): Long
  fun walkTopDown(): Sequence<UnifiedFileInterface>

  val copyMoveStrategy: CopyMoveStrategy
  suspend fun copyTo(dest: DestinationSpec) = copyMoveStrategy.copyTo(dest)
  suspend fun moveTo(dest: DestinationSpec): Uri = copyMoveStrategy.moveTo(dest)
}
