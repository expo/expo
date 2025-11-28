package expo.modules.contacts.next.domain

import android.content.ContentProviderOperation
import android.content.ContentResolver
import android.database.Cursor
import android.provider.ContactsContract
import expo.modules.contacts.next.ContactIdNotFoundException
import expo.modules.contacts.next.ContactNotFoundException
import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.contact.ContactPatch
import expo.modules.contacts.next.domain.model.contact.ExistingContact
import expo.modules.contacts.next.domain.model.contact.NewContact
import expo.modules.contacts.next.domain.query.QueryAggregator
import expo.modules.contacts.next.domain.query.QueryBuilder
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.extensions.asIterable
import expo.modules.contacts.next.extensions.extractId
import expo.modules.contacts.next.extensions.getContactIdFromRawContactId
import expo.modules.contacts.next.extensions.queryOne
import expo.modules.contacts.next.extensions.safeApplyBatch
import expo.modules.contacts.next.extensions.safeDelete
import expo.modules.contacts.next.extensions.safeQuery
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext

class ContactRepository(val contentResolver: ContentResolver) {
  suspend fun insert(contact: NewContact): ContactId = withContext(Dispatchers.IO) {
    val operations = contact.toInsertOperations()
    val result = contentResolver.safeApplyBatch(ContactsContract.AUTHORITY, operations)
    val rawContactId = RawContactId(result.extractId())
    return@withContext contentResolver.getContactIdFromRawContactId(rawContactId)
      ?: throw ContactIdNotFoundException()
  }

  suspend fun patch(contactPatch: ContactPatch): Boolean = withContext(Dispatchers.IO) {
    val operations = contactPatch.toPatchOperations()
    contentResolver.safeApplyBatch(ContactsContract.AUTHORITY, operations)
    return@withContext true
  }

  suspend fun delete(contactId: ContactId): Boolean = withContext(Dispatchers.IO) {
    val rowsDeleted = contentResolver.safeDelete(
      uri = ContactsContract.RawContacts.CONTENT_URI,
      where = "${ContactId.COLUMN_IN_RAW_CONTACTS_TABLE} = ?",
      selectionArgs = arrayOf(contactId.value)
    )
    return@withContext rowsDeleted > 0
  }

  suspend fun append(appendable: Appendable): DataId = withContext(Dispatchers.IO) {
    val operation = appendable.toAppendOperation()
    val result = contentResolver.safeApplyBatch(ContactsContract.AUTHORITY, operation)
    val id = result.extractId()
    return@withContext DataId(id)
  }

  suspend fun update(updatable: Updatable): Boolean = withContext(Dispatchers.IO) {
    val operation = updatable.toUpdateOperation()
    contentResolver.safeApplyBatch(ContactsContract.AUTHORITY, operation)
    return@withContext true
  }

  suspend fun deleteFieldEntry(dataId: DataId): Boolean = withContext(Dispatchers.IO) {
    val operation = ContentProviderOperation.newDelete(ContactsContract.Data.CONTENT_URI)
      .withSelection("${DataId.COLUMN_IN_DATA_TABLE} = ?", arrayOf(dataId.value))
      .build()
    contentResolver.safeApplyBatch(ContactsContract.AUTHORITY, operation)
    return@withContext true
  }

  suspend fun getAllIds(): List<ContactId> = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = ContactsContract.Data.CONTENT_URI,
      projection = arrayOf(ContactId.COLUMN_IN_DATA_TABLE)
    ).use { cursor ->
      ensureActive()
      cursor
        .asIterable()
        .map { it.getString(it.getColumnIndexOrThrow(ContactId.COLUMN_IN_DATA_TABLE)) }
        .map { ContactId(it) }
    }
  }

  suspend fun getById(
    extractableFields: Set<ExtractableField<*>>,
    contactId: ContactId
  ): ExistingContact? = withContext(Dispatchers.IO) {
    val queryBuilder = QueryBuilder(extractableFields)
    contentResolver.safeQuery(
      uri = ContactsContract.Data.CONTENT_URI,
      projection = queryBuilder.buildProjection(),
      selection = queryBuilder.buildMimeTypeAndContactIdSelection(),
      selectionArgs = queryBuilder.buildMimeTypeAndContactIdSelectionArgs(contactId)
    ).use { cursor ->
      ensureActive()
      if (cursor.count == 0) {
        throw ContactNotFoundException()
      }
      QueryAggregator.aggregate(cursor, extractableFields)[0]
    }
  }

  suspend fun getAll(
    extractableFields: Set<ExtractableField<*>>
  ): Collection<ExistingContact> = withContext(Dispatchers.IO) {
    val queryBuilder = QueryBuilder(
      extractableFields.filterIsInstance<ExtractableField.Data<*>>().toSet()
    )
    contentResolver.safeQuery(
      uri = ContactsContract.Data.CONTENT_URI,
      projection = queryBuilder.buildProjection(),
      selection = queryBuilder.buildMimeTypeSelection(),
      selectionArgs = queryBuilder.buildMimeTypeSelectionArgs()
    ).use { cursor ->
      ensureActive()
      QueryAggregator.aggregate(cursor, extractableFields)
    }
  }

  suspend fun <T : Extractable.Data> getFieldFromData(
    extractableField: ExtractableField.Data<T>,
    contactId: ContactId
  ): List<T> = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = ContactsContract.Data.CONTENT_URI,
      projection = extractableField.projection,
      selection = "${ContactId.COLUMN_IN_DATA_TABLE} = ? AND ${ContactsContract.Data.MIMETYPE} = ?",
      selectionArgs = arrayOf(contactId.value, extractableField.mimeType)
    ).use { cursor ->
      ensureActive()
      QueryAggregator.aggregateOneField(cursor, extractableField)
    }
  }

  suspend fun <T : Extractable> getFieldFromContacts(
    extractableField: ExtractableField.Contacts<T>,
    contactId: ContactId
  ): T? = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = ContactsContract.Contacts.CONTENT_URI,
      projection = extractableField.projection,
      selection = "${ContactId.COLUMN_IN_CONTACTS_TABLE} = ?",
      selectionArgs = arrayOf(contactId.value)
    ).use { cursor ->
      ensureActive()
      QueryAggregator.aggregateOneFieldFromContacts(cursor, extractableField)
    }
  }

  suspend fun getLookupKey(contactId: ContactId): String? = withContext(Dispatchers.IO) {
    contentResolver.queryOne(
      uri = ContactsContract.Contacts.CONTENT_URI,
      column = ContactsContract.Contacts.LOOKUP_KEY,
      extractor = Cursor::getString,
      selection = "${ContactId.COLUMN_IN_CONTACTS_TABLE} = ?",
      selectionArgs = arrayOf(contactId.value)
    )
  }

  suspend fun getRawContactId(
    contactId: ContactId
  ): RawContactId? = withContext(Dispatchers.IO) {
    val selectionBuilder = StringBuilder("${ContactsContract.RawContacts.CONTACT_ID}=?")
    // Currently only modifying a local account is supported
    selectionBuilder.append(" AND ${ContactsContract.RawContacts.ACCOUNT_TYPE} IS NULL")
    selectionBuilder.append(" AND ${ContactsContract.RawContacts.ACCOUNT_NAME} IS NULL")

    contentResolver.queryOne(
      uri = ContactsContract.RawContacts.CONTENT_URI,
      column = RawContactId.COLUMN_IN_RAW_CONTACTS_TABLE,
      extractor = Cursor::getString,
      selection = selectionBuilder.toString(),
      selectionArgs = arrayOf(contactId.value)
    )?.let {
      RawContactId(it)
    }
  }
}
