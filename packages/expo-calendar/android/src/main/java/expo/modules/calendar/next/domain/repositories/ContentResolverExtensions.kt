package expo.modules.calendar.next.domain.repositories

import android.Manifest
import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import expo.modules.calendar.next.exceptions.CouldNotExecuteQueryException
import expo.modules.calendar.next.exceptions.PermissionException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

suspend fun ContentResolver.safeQuery(
  uri: Uri,
  projection: Array<String>,
  selection: String? = null,
  selectionArgs: Array<String>? = null,
  sortOrder: String? = null
): Cursor = withContext(Dispatchers.IO) {
  try {
    query(uri, projection, selection, selectionArgs, sortOrder)
      ?: throw CouldNotExecuteQueryException("Cursor returned by query is null")
  } catch (e: SecurityException) {
    throw PermissionException(Manifest.permission.READ_CALENDAR, e)
  }
}

suspend fun ContentResolver.safeDelete(
  uri: Uri,
  where: String? = null,
  selectionArgs: Array<String>? = null
): Int = withContext(Dispatchers.IO) {
  try {
    delete(uri, where, selectionArgs)
  } catch (e: SecurityException) {
    throw PermissionException(Manifest.permission.WRITE_CALENDAR, e)
  }
}

suspend fun ContentResolver.safeUpdate(
  uri: Uri,
  values: android.content.ContentValues,
  where: String? = null,
  selectionArgs: Array<String>? = null
): Int = withContext(Dispatchers.IO) {
  try {
    update(uri, values, where, selectionArgs)
  } catch (e: SecurityException) {
    throw PermissionException(Manifest.permission.WRITE_CALENDAR, e)
  }
}

suspend fun ContentResolver.safeInsert(
  uri: Uri,
  values: android.content.ContentValues
): Uri = withContext(Dispatchers.IO) {
  try {
    insert(uri, values)
      ?: throw CouldNotExecuteQueryException("Couldn't insert content, returned URI is null")
  } catch (e: SecurityException) {
    throw PermissionException(Manifest.permission.WRITE_CALENDAR, e)
  }
}
