package expo.modules.contacts.next.records.fields

import expo.modules.contacts.next.records.ExistingRecord
import expo.modules.contacts.next.records.NewRecord
import expo.modules.contacts.next.records.PatchRecord
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Required
import expo.modules.kotlin.types.ValueOrUndefined

sealed interface UrlAddressRecord {
  data class Existing(
    @Required @Field override val id: String,
    @Field val label: String? = null,
    @Field val url: String? = null
  ) : ExistingRecord

  data class New(
    @Field val label: String? = null,
    @Field val url: String? = null
  ) : NewRecord

  class Patch() : PatchRecord {
    @Required @Field
    override lateinit var id: String

    @Field val label: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()

    @Field val url: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()
  }
}
