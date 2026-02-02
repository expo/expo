package expo.modules.filesystem.unifiedfile

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import android.webkit.MimeTypeMap
import expo.modules.filesystem.fsops.CopyMoveStrategy
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import java.io.InputStream
import java.io.OutputStream

/**
 * Implementation of UnifiedFileInterface for generic content:// URIs
 * that are NOT Storage Access Framework (SAF) URIs.
 *
 * Examples: MediaStore URIs, custom content provider URIs, share intent URIs.
 *
 * This implementation:
 * - Uses ContentResolver directly (no DocumentFile)
 * - Supports basic stream operations (read/write)
 * - Does NOT support directory operations (create, list, delete)
 * - May or may not support random access (openChannel) depending on the provider
 */
class ContentProviderFile(
  private val context: Context,
  override val uri: Uri
) : UnifiedFileInterface {

  override fun exists(): Boolean = runCatching {
    context.contentResolver.openInputStream(uri)?.use { true }
  }.getOrNull() ?: false

  override fun isFile(): Boolean = exists()

  override fun isDirectory(): Boolean = false

  override val parentFile: UnifiedFileInterface? = null

  override fun createFile(mimeType: String, displayName: String): UnifiedFileInterface? {
    throw UnsupportedOperationException("Cannot create files in generic content provider: $uri")
  }

  override fun createDirectory(displayName: String): UnifiedFileInterface? {
    throw UnsupportedOperationException("Cannot create directories in generic content provider: $uri")
  }

  override fun delete(): Boolean {
    throw UnsupportedOperationException("Cannot delete from generic content provider: $uri")
  }

  override fun deleteRecursively(): Boolean {
    throw UnsupportedOperationException("Cannot delete from generic content provider: $uri")
  }

  override fun listFilesAsUnified(): List<UnifiedFileInterface> = emptyList()

  override val type: String?
    get() {
      context.contentResolver.getType(uri)?.let { mimeType ->
        return mimeType
      }

      val extension = MimeTypeMap.getFileExtensionFromUrl(uri.toString())
      return extension.takeUnless { it.isNullOrEmpty() }?.let { ext ->
        MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext.lowercase())
      }
    }

  override fun lastModified(): Long? {
    return queryColumn(OpenableColumns.SIZE)?.toLongOrNull()
  }

  override val creationTime: Long? = null

  override val fileName: String?
    get() = queryColumn(OpenableColumns.DISPLAY_NAME) ?: uri.lastPathSegment

  override fun getContentUri(appContext: AppContext): Uri = uri

  override fun outputStream(append: Boolean): OutputStream {
    return context.contentResolver.openOutputStream(uri)
      ?: throw Exceptions.IllegalStateException("Unable to open output stream for URI: $uri")
  }

  override fun inputStream(): InputStream {
    return context.contentResolver.openInputStream(uri)
      ?: throw Exceptions.IllegalStateException("Unable to open input stream for URI: $uri")
  }

  override fun length(): Long {
    queryColumn(OpenableColumns.SIZE)?.toLongOrNull()?.let { size ->
      return size
    }

    return runCatching {
      inputStream().use { stream ->
        var total = 0L
        val buffer = ByteArray(8192)
        var read: Int
        while (stream.read(buffer).also { read = it } != -1) {
          total += read
        }
        total
      }
    }.getOrNull() ?: 0L
  }

  override fun walkTopDown(): Sequence<UnifiedFileInterface> = sequenceOf(this)

  override val copyMoveStrategy: CopyMoveStrategy = CopyMoveStrategy.ContentProvider(this)

  /**
   * Helper to query a column from the ContentResolver.
   */
  private fun queryColumn(column: String): String? {
    return runCatching {
      context.contentResolver.query(uri, arrayOf(column), null, null, null)?.use { cursor ->
        cursor.takeIf { it.moveToFirst() }?.let { cursor ->
          cursor.getColumnIndex(column).takeIf { it >= 0 }?.let { index ->
            cursor.getString(index)
          }
        }
      }
    }.getOrNull()
  }
}
