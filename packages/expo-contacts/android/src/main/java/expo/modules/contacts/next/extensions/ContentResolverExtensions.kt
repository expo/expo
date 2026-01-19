package expo.modules.contacts.next.extensions

import android.Manifest
import android.content.ContentProviderOperation
import android.content.ContentProviderResult
import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import android.provider.ContactsContract
import expo.modules.contacts.next.CouldNotExecuteQueryException
import expo.modules.contacts.next.PermissionException
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext

suspend fun ContentResolver.safeDelete(
  uri: Uri,
  where: String? = null,
  selectionArgs: Array<String>? = null
): Int = withContext(Dispatchers.IO) {
  try {
    delete(uri, where, selectionArgs)
  } catch (e: SecurityException) {
    throw PermissionException(Manifest.permission.WRITE_CONTACTS, e)
  }
}

suspend fun ContentResolver.safeApplyBatch(
  authority: String,
  operation: ContentProviderOperation
): Array<ContentProviderResult> =
  safeApplyBatch(authority, listOf(operation))

suspend fun ContentResolver.safeApplyBatch(
  authority: String,
  operations: List<ContentProviderOperation>
): Array<ContentProviderResult> = withContext(Dispatchers.IO) {
  try {
    applyBatch(authority, ArrayList(operations))
  } catch (e: SecurityException) {
    throw PermissionException(Manifest.permission.WRITE_CONTACTS, e)
  }
}

suspend fun ContentResolver.getContactIdFromRawContactId(
  rawContactId: RawContactId
): ContactId? = withContext(Dispatchers.IO) {
  val contactIdString = queryOne(
    uri = ContactsContract.RawContacts.CONTENT_URI,
    column = ContactId.COLUMN_IN_RAW_CONTACTS_TABLE,
    extractor = Cursor::getString,
    selection = "${ContactsContract.RawContacts._ID} = ?",
    selectionArgs = arrayOf(rawContactId.value)
  )
  contactIdString?.let {
    ContactId(contactIdString)
  }
}

suspend fun <T> ContentResolver.queryOne(
  uri: Uri,
  column: String,
  extractor: Cursor.(index: Int) -> T,
  selection: String? = null,
  selectionArgs: Array<String>? = null,
  sortOrder: String? = null
): T? = withContext(Dispatchers.IO) {
  val projection = arrayOf(column)
  safeQuery(uri, projection, selection, selectionArgs, sortOrder).use { cursor ->
    ensureActive()
    val index = cursor.getColumnIndexOrThrow(column)
    return@withContext if (cursor.moveToFirst()) {
      extractor(cursor, index)
    } else {
      null
    }
  }
}

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
    throw PermissionException(Manifest.permission.READ_CONTACTS, e)
  }
}
