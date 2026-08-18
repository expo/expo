package expo.modules.medialibrary.next.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class SortDescriptor(
  @Field val key: AssetField,
  @Field val ascending: Boolean? = true
) : Record {
  fun toMediaStoreQueryString(): String {
    val ascendingString = if (ascending ?: true) "ASC" else "DESC"
    return "${key.toMediaStoreColumn()} $ascendingString"
  }
}
