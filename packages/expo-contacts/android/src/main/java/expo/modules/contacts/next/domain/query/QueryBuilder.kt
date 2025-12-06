package expo.modules.contacts.next.domain.query

import android.provider.ContactsContract
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.domain.wrappers.DataId

class QueryBuilder(
  val extractors: Set<ExtractableField<*>>,
  val contactIds: Collection<ContactId>? = null
) {
  private val dataFields = extractors.filterIsInstance<ExtractableField.Data<*>>().toSet()

  fun buildProjection(): Array<String> {
    val requiredColumns = listOf(
      ContactId.COLUMN_IN_DATA_TABLE,
      DataId.COLUMN_IN_DATA_TABLE,
      ContactsContract.Data.MIMETYPE
    )
    return extractors
      .flatMap { it.projection.toList() }
      .toSet()
      .plus(requiredColumns)
      .toTypedArray()
  }

  fun buildSelection(): String? {
    val selectionParts = mutableListOf<String>()

    val mimeTypes = dataFields
      .map { it.mimeType }
      .toSet()

    if (mimeTypes.isNotEmpty()) {
      val mimePlaceholders = mimeTypes.joinToString(separator = ", ") { "?" }
      selectionParts.add("${ContactsContract.Data.MIMETYPE} IN ($mimePlaceholders)")
    }

    if (!contactIds.isNullOrEmpty()) {
      val idPlaceholders = contactIds.joinToString(separator = ", ") { "?" }
      selectionParts.add("${ContactId.COLUMN_IN_DATA_TABLE} IN ($idPlaceholders)")
    }

    if (selectionParts.isEmpty()) {
      return null
    }

    return selectionParts.joinToString(separator = " AND ") { "($it)" }
  }

  fun buildSelectionArgs(): Array<String> {
    val mimeTypes = dataFields.map { it.mimeType }.toSet()
    val mimeArgs = mimeTypes.toTypedArray()

    if (contactIds.isNullOrEmpty()) {
      return mimeArgs
    }

    val idArgs = contactIds.map { it.value }.toTypedArray()
    return mimeArgs + idArgs
  }
}
