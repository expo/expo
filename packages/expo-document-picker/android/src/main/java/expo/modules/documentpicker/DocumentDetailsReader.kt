package expo.modules.documentpicker

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns

data class DocumentDetails(val name: String, val uri: String, val size: Int?)

class DocumentDetailsReader(private val context: Context) {
  fun read(uri: Uri): DocumentDetails? {
    context
      .contentResolver
      .query(uri, null, null, null, null)
      ?.use { cursor ->
        cursor.moveToFirst()
        val name = cursor.getString(cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME))
        val uriString = uri.toString()
        val size = cursor.getColumnIndex(OpenableColumns.SIZE).let { sizeColumnIndex ->
          if (!cursor.isNull(sizeColumnIndex)) {
            cursor.getInt(sizeColumnIndex)
          } else {
            null
          }
        }
        return DocumentDetails(name, uriString, size)
      }
    return null
  }
}
