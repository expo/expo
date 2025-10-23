package expo.modules.medialibrary.next.extensions.resolver

import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext

suspend fun <T> ContentResolver.queryOne(
  contentUri: Uri,
  column: String,
  extractor: Cursor.(index: Int) -> T,
  selection: String? = null,
  selectionArgs: Array<String>? = null,
  sortOrder: String? = null
): T? = withContext(Dispatchers.IO) {
  val projection = arrayOf(column)
  query(contentUri, projection, selection, selectionArgs, sortOrder)?.use { cursor ->
    ensureActive()
    val index = cursor.getColumnIndexOrThrow(column)
    return@withContext if (cursor.moveToFirst()) {
      extractor(cursor, index)
    } else {
      null
    }
  }
  return@withContext null
}
