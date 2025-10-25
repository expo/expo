package expo.modules.medialibrary.next.extensions.resolver

import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import expo.modules.medialibrary.next.exceptions.PermissionException

fun ContentResolver.safeQuery(
  uri: Uri,
  projection: Array<String>,
  selection: String? = null,
  selectionArgs: Array<String>? = null,
  sortOrder: String? = null
): Cursor? {
  return try {
    query(uri, projection, selection, selectionArgs, sortOrder)
  } catch (_: SecurityException) {
    throw PermissionException("Missing required system permissions")
  }
}
