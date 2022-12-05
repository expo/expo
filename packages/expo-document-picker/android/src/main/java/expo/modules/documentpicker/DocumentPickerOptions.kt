package expo.modules.documentpicker

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class DocumentPickerOptions(
  @Field val copyToCacheDirectory: Boolean,
  @Field val types: Array<String>?
  ) : Record {


  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (javaClass != other?.javaClass) return false

    other as DocumentPickerOptions

    if (copyToCacheDirectory != other.copyToCacheDirectory) return false
    if (!types.contentEquals(other.types)) return false

    return true
  }

  override fun hashCode(): Int {
    var result = copyToCacheDirectory.hashCode()
    result = 31 * result + types.contentHashCode()
    return result
  }
}
