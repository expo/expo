package expo.modules.contacts.next.domain

import android.content.ContentProviderOperation
import android.content.ContentResolver
import android.database.Cursor
import android.provider.ContactsContract
import expo.modules.contacts.next.ContactIdNotFoundException
import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.contact.ContactPatch
import expo.modules.contacts.next.domain.model.contact.ExistingContact
import expo.modules.contacts.next.domain.model.contact.NewContact
import expo.modules.contacts.next.domain.model.contact.UpdateContact
import expo.modules.contacts.next.domain.query.QueryAggregator
import expo.modules.contacts.next.domain.query.QueryBuilder
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.extensions.asSequence
import expo.modules.contacts.next.extensions.extractId
import expo.modules.contacts.next.extensions.getContactIdFromRawContactId
import expo.modules.contacts.next.extensions.queryOne
import expo.modules.contacts.next.extensions.safeApplyBatch
import expo.modules.contacts.next.extensions.safeDelete
import expo.modules.contacts.next.extensions.safeQuery
import expo.modules.contacts.next.records.SortOrder
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

  suspend fun patch(contactPatch: ContactPatch): Boolean {
    val operations = contactPatch.toPatchOperations()
    contentResolver.safeApplyBatch(ContactsContract.AUTHORITY, operations)
    return true
  }

  suspend fun update(updateContact: UpdateContact): Boolean {
    contentResolver.safeDelete(
      uri = ContactsContract.Data.CONTENT_URI,
      where = "${RawContactId.COLUMN_IN_DATA_TABLE} = ?",
      selectionArgs = arrayOf(updateContact.rawContactId.value)
    )
    val operations = updateContact.toAppend
      .map { it.toAppendOperation() }
      .plus(updateContact.starred.toUpdateOperation())
    contentResolver.safeApplyBatch(ContactsContract.AUTHORITY, operations)
    return true
  }

  suspend fun delete(contactId: ContactId): Boolean {
    val rowsDeleted = contentResolver.safeDelete(
      uri = ContactsContract.RawContacts.CONTENT_URI,
      where = "${ContactId.COLUMN_IN_RAW_CONTACTS_TABLE} = ?",
      selectionArgs = arrayOf(contactId.value)
    )
    return rowsDeleted > 0
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

  suspend fun getAllIds(
    limit: Int? = null,
    offset: Int? = null,
    searchedDisplayName: String? = null,
    sortOrder: SortOrder? = SortOrder.UserDefault,
  ): List<ContactId> = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = ContactsContract.Data.CONTENT_URI,
      projection = arrayOf(ContactId.COLUMN_IN_DATA_TABLE),
      selection = searchedDisplayName?.let { "${ContactsContract.Contacts.DISPLAY_NAME} LIKE ?" },
      selectionArgs = searchedDisplayName?.let { arrayOf("%$it%") },
      sortOrder = sortOrder?.toColumn()
    ).use { cursor ->
      ensureActive()
      cursor.moveToPosition((offset ?: 0) - 1)
      cursor
        .asSequence()
        .take(limit ?: Int.MAX_VALUE)
        .map { it.getString(it.getColumnIndexOrThrow(ContactId.COLUMN_IN_DATA_TABLE)) }
        .map { ContactId(it) }
        .toList()
    }
  }

  suspend fun getById(
    extractableFields: Set<ExtractableField<*>>,
    contactId: ContactId
  ): ExistingContact? = withContext(Dispatchers.IO) {
    val queryBuilder = QueryBuilder(extractableFields, listOf(contactId))
    contentResolver.safeQuery(
      uri = ContactsContract.Data.CONTENT_URI,
      projection = queryBuilder.buildProjection(),
      selection = queryBuilder.buildSelection(),
      selectionArgs = queryBuilder.buildSelectionArgs()
    ).use { cursor ->
      ensureActive()
      if (cursor.count == 0) {
        return@withContext null
      }
      QueryAggregator.aggregate(cursor, extractableFields)[0]
    }
  }

  suspend fun getAllPaginated(
    extractableFields: Set<ExtractableField<*>>,
    limit: Int? = null,
    offset: Int? = null,
    searchedDisplayName: String? = null,
    sortOrder: SortOrder? = null,
  ): Collection<ExistingContact> {
    // In this code we utilize two-step query
    // Since there is no way of getting limit and offset when fetching contact details
    // (because query returns one row for each mimeType)
    // Firstly we query all ids with applying limit and offset, and then using those ids
    // we execute another query with filtering by ids
    // This tactic makes the query perfectly scales as the contacts database gets bigger
    val contactIds = getAllIds(limit, offset, searchedDisplayName, sortOrder)
    return getAll(extractableFields, contactIds)
  }

  suspend fun getAll(
    extractableFields: Set<ExtractableField<*>>,
    contactIds: Collection<ContactId>?,
  ): Collection<ExistingContact> = withContext(Dispatchers.IO) {
    val queryBuilder = QueryBuilder(extractableFields, contactIds)
    contentResolver.safeQuery(
      uri = ContactsContract.Data.CONTENT_URI,
      projection = queryBuilder.buildProjection(),
      selection = queryBuilder.buildSelection(),
      selectionArgs = queryBuilder.buildSelectionArgs()
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

  suspend fun getCount(): Int = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = ContactsContract.Contacts.CONTENT_URI,
      projection = arrayOf(ContactId.COLUMN_IN_CONTACTS_TABLE)
    ).use { cursor ->
      ensureActive()
      return@withContext cursor.count
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
