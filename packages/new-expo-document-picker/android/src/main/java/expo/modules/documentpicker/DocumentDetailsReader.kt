package expo.modules.documentpicker

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import android.provider.DocumentsContract
import java.io.File
import java.io.IOException

class DocumentDetailsReader(private val context: Context) {
  fun read(uri: Uri): DocumentInfo {
    context
      .contentResolver
      .query(uri, null, null, null, null)
      ?.use { cursor ->
        cursor.moveToFirst()
        val columnIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        val name = cursor.getString(columnIndex)
        val size = cursor.getColumnIndex(OpenableColumns.SIZE).let { sizeColumnIndex ->
          if (!cursor.isNull(sizeColumnIndex)) {
            cursor.getLong(sizeColumnIndex)
          } else {
            null
          }
        }
        val mimeType = context.contentResolver.getType(uri)

        // Get last modified date or use current date if not available.
        // This follows the Web API spec.
        // https://developer.mozilla.org/en-US/docs/Web/API/File/lastModified
        val lastModified = try {
          // First try to get it from the content resolver
          val lastModifiedColumn = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_LAST_MODIFIED)
          if (lastModifiedColumn != -1 && !cursor.isNull(lastModifiedColumn)) {
            cursor.getLong(lastModifiedColumn)
          } else {
            // Fallback to getting it from the file
            val file = File(uri.path ?: "")
            if (file.exists()) {
              file.lastModified()
            } else {
              System.currentTimeMillis()
            }
          }
        } catch (e: Exception) {
          // If all else fails, use current time
          System.currentTimeMillis()
        }

        return DocumentInfo(uri, name, mimeType, size, lastModified)
      } ?: throw IOException("Failed to read document details for URI: $uri")
  }
}
