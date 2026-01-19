package expo.modules.contacts.next.domain.query

import android.provider.ContactsContract
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.domain.wrappers.DataId

class QueryBuilder(
  extractableFields: Collection<ExtractableField<*>>
) {
  private val dataExtractableFields = extractableFields.filterIsInstance<ExtractableField.Data<*>>()
  private val contactsExtractableFields = extractableFields.filterIsInstance<ExtractableField.Contacts<*>>()

  fun buildContactsProjection(): Array<String> {
    val requiredColumns = listOf(
      ContactId.COLUMN_IN_CONTACTS_TABLE
    )
    return contactsExtractableFields
      .flatMap { it.projection.toList() }
      .toSet()
      .plus(requiredColumns)
      .toTypedArray()
  }

  fun buildDataProjection(): Array<String> {
    val requiredColumns = listOf(
      ContactId.COLUMN_IN_DATA_TABLE,
      DataId.COLUMN_IN_DATA_TABLE,
      ContactsContract.Data.MIMETYPE
    )
    return dataExtractableFields
      .flatMap { it.projection.toList() }
      .toSet()
      .plus(requiredColumns)
      .toTypedArray()
  }

  fun buildSelection(
    contactIds: Collection<ContactId>? = null
  ): String? {
    val selectionParts = mutableListOf<String>()

    val mimeTypes = dataExtractableFields
      .map { it.mimeType }
      .toSet()

    if (mimeTypes.isNotEmpty()) {
      val mimePlaceholders = mimeTypes.joinToString(separator = ", ") { "?" }
      selectionParts.add("${ContactsContract.Data.MIMETYPE} IN ($mimePlaceholders)")
    }

    if (contactIds != null) {
      val idPlaceholders = contactIds.joinToString(separator = ", ") { "?" }
      selectionParts.add("${ContactId.COLUMN_IN_DATA_TABLE} IN ($idPlaceholders)")
    }

    if (selectionParts.isEmpty()) {
      return null
    }

    return selectionParts.joinToString(separator = " AND ") { "($it)" }
  }

  fun buildSelectionArgs(
    contactIds: Collection<ContactId>? = null
  ): Array<String> {
    val mimeTypes = dataExtractableFields
      .map { it.mimeType }
      .toSet()
    val mimeArgs = mimeTypes.toTypedArray()

    if (contactIds.isNullOrEmpty()) {
      return mimeArgs
    }

    val idArgs = contactIds.map { it.value }.toTypedArray()
    return mimeArgs + idArgs
  }
}
