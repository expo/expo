package expo.modules.medialibrary.next.objects.query.builder

import android.content.ContentResolver
import android.database.Cursor

fun interface QueryExecutor {
  suspend fun exe(projection: Array<String>, contentResolver: ContentResolver): Cursor
}
