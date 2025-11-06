package expo.modules.contacts.next.domain.query

import android.provider.ContactsContract
import expo.modules.contacts.next.domain.model.ExtractableField
import expo.modules.contacts.next.domain.wrappers.ContactId
import expo.modules.contacts.next.domain.wrappers.DataId

class QueryBuilder(val extractors: Set<ExtractableField<*>>) {
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

  fun buildMimeTypeSelection(): String {
    val mimeTypes = extractors
      .map { it.mimeType }
      .toSet()
      .toTypedArray()
    val placeholders = mimeTypes.joinToString(separator = ", ") { "?" }
    return "${ContactsContract.Data.MIMETYPE} IN ($placeholders)"
  }

  fun buildMimeTypeAndContactIdSelection(): String {
    return "${buildMimeTypeSelection()} AND ${ContactId.COLUMN_IN_DATA_TABLE} = ?"
  }

  fun buildMimeTypeAndContactIdSelectionArgs(contactId: ContactId): Array<String> {
    return buildMimeTypeSelectionArgs()
      .plus(contactId.value)
  }

  fun buildMimeTypeSelectionArgs(): Array<String> {
    return extractors
      .map { it.mimeType }
      .toTypedArray()
  }
}
