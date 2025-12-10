package expo.modules.contacts.next.records.fields

import expo.modules.contacts.next.records.ExistingRecord
import expo.modules.contacts.next.records.NewRecord
import expo.modules.contacts.next.records.PatchRecord
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Required
import expo.modules.kotlin.types.ValueOrUndefined

sealed interface RelationRecord {
  data class Existing(
    @Required @Field override val id: String,
    @Field val name: String? = null,
    @Field val label: String? = null
  ) : ExistingRecord

  data class New(
    @Field val label: String? = null,
    @Field val name: String? = null
  ) : NewRecord

  class Patch() : PatchRecord {
    @Required @Field
    override lateinit var id: String
    @Field val label: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()
    @Field val name: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()
  }
}
