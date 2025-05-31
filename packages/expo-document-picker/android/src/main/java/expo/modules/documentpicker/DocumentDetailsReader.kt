package expo.modules.documentpicker

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
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
        return DocumentInfo(uri, name, mimeType, size)
      } ?: throw IOException("Failed to read document details for URI: $uri")
  }
}
