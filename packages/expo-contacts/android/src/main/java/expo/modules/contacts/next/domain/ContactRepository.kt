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

  suspend fun patch(contactPatch: ContactPatch): Boolean = withContext(Dispatchers.IO) {
    val operations = contactPatch.toPatchOperations().toMutableList()
    val idsToKeep = contactPatch.toUpdate
      .filterIsInstance<Updatable.Data>()
      .map { it.dataId }
      .toSet()
    operations.addAll(
      getDataIds(contactPatch.contactId, contactPatch.modifiedFields)
        .minus(idsToKeep)
        .map {
          ContentProviderOperation.newDelete(ContactsContract.Data.CONTENT_URI)
            .withSelection("${ContactsContract.Data._ID} = ?", arrayOf(it.value))
            .build()
        }
    )
    contentResolver.safeApplyBatch(ContactsContract.AUTHORITY, operations)
    return@withContext true
  }

  private suspend fun getDataIds(
    contactId: ContactId,
    extractableFields: Set<ExtractableField.Data<*>>
  ): List<DataId> = withContext(Dispatchers.IO) {
    val mimeTypes = extractableFields
      .map { it.mimeType }
      .distinct()
    val inClausePlaceholders = mimeTypes.joinToString(",") { "?" }

    contentResolver.safeQuery(
      uri = ContactsContract.Data.CONTENT_URI,
      projection = arrayOf(ContactsContract.Data._ID),
      selection = "${ContactsContract.Data.CONTACT_ID} = ? AND ${ContactsContract.Data.MIMETYPE} IN ($inClausePlaceholders)",
      selectionArgs = arrayOf(contactId.value) + mimeTypes.toTypedArray()
    ).use { cursor ->
      ensureActive()
      cursor.asSequence()
        .map { it.getString(0) }
        .map { DataId(it) }
        .toList()
    }
  }

  suspend fun update(updateContact: UpdateContact): Boolean {
    val deleteOperation = ContentProviderOperation
      .newDelete(ContactsContract.Data.CONTENT_URI)
      .withSelection(
        "${RawContactId.COLUMN_IN_DATA_TABLE} = ?",
        arrayOf(updateContact.rawContactId.value)
      )
      .build()
    val operations = buildList {
      add(deleteOperation)
      addAll(updateContact.toAppend.map { it.toAppendOperation() })
      add(updateContact.starred.toUpdateOperation())
    }
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
    sortOrder: SortOrder? = SortOrder.UserDefault
  ): List<ContactId> = withContext(Dispatchers.IO) {
    contentResolver.safeQuery(
      uri = ContactsContract.Contacts.CONTENT_URI,
      projection = arrayOf(ContactId.COLUMN_IN_CONTACTS_TABLE),
      selection = searchedDisplayName?.let { "${ContactsContract.Contacts.DISPLAY_NAME} LIKE ?" },
      selectionArgs = searchedDisplayName?.let { arrayOf("%$it%") },
      sortOrder = sortOrder?.toColumn()
    ).use { cursor ->
      ensureActive()
      cursor.moveToPosition((offset ?: 0) - 1)
      cursor
        .asSequence()
        .take(limit ?: Int.MAX_VALUE)
        .map { it.getString(it.getColumnIndexOrThrow(ContactId.COLUMN_IN_CONTACTS_TABLE)) }
        .map { ContactId(it) }
        .toList()
    }
  }

  suspend fun getById(
    extractableFields: Set<ExtractableField<*>>,
    contactId: ContactId
  ): ExistingContact? = withContext(Dispatchers.IO) {
    val queryAggregator = QueryAggregator(extractableFields)
    val queryBuilder = QueryBuilder(extractableFields)

    contentResolver.safeQuery(
      uri = ContactsContract.Contacts.CONTENT_URI,
      projection = queryBuilder.buildContactsProjection(),
      selection = "${ContactId.COLUMN_IN_CONTACTS_TABLE} = ?",
      selectionArgs = arrayOf(contactId.value)
    ).use { cursor ->
      cursor
        .asSequence()
        .forEach { _ -> queryAggregator.aggregateContactsRow(cursor) }
    }

    contentResolver.safeQuery(
      uri = ContactsContract.Data.CONTENT_URI,
      projection = queryBuilder.buildDataProjection(),
      selection = queryBuilder.buildSelection(listOf(contactId)),
      selectionArgs = queryBuilder.buildSelectionArgs(listOf(contactId))
    ).use { cursor ->
      ensureActive()
      cursor
        .asSequence()
        .forEach { _ -> queryAggregator.aggregateDataRow(cursor) }
    }
    val contacts = queryAggregator.buildContacts()
    return@withContext if (contacts.isNotEmpty()) contacts[0] else null
  }

  suspend fun getAllPaginated(
    extractableFields: Set<ExtractableField<*>>,
    limit: Int? = null,
    offset: Int? = null,
    searchedDisplayName: String? = null,
    sortOrder: SortOrder? = null
  ): Collection<ExistingContact> = withContext(Dispatchers.IO) {
    val queryAggregator = QueryAggregator(extractableFields)
    val queryBuilder = QueryBuilder(extractableFields)
    contentResolver.safeQuery(
      uri = ContactsContract.Contacts.CONTENT_URI,
      projection = queryBuilder.buildContactsProjection(),
      selection = searchedDisplayName?.let { "${ContactsContract.Contacts.DISPLAY_NAME_PRIMARY} LIKE ?" },
      selectionArgs = searchedDisplayName?.let { arrayOf("%$it%") },
      sortOrder = sortOrder?.toColumn()
    ).use { cursor ->
      ensureActive()
      cursor.moveToPosition((offset ?: 0) - 1)
      cursor
        .asSequence()
        .take(limit ?: Int.MAX_VALUE)
        .forEach { _ -> queryAggregator.aggregateContactsRow(cursor) }
    }

    val contactIds = queryAggregator.getContactIdsFromBuilders()
    contentResolver.safeQuery(
      uri = ContactsContract.Data.CONTENT_URI,
      projection = queryBuilder.buildDataProjection(),
      selection = queryBuilder.buildSelection(contactIds),
      selectionArgs = queryBuilder.buildSelectionArgs(contactIds)
    ).use { cursor ->
      ensureActive()
      cursor
        .asSequence()
        .forEach { _ -> queryAggregator.aggregateDataRow(cursor) }
    }
    return@withContext queryAggregator.buildContacts()
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
