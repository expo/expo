package expo.modules.contacts.next.records.fields

import expo.modules.contacts.next.records.ExistingRecord
import expo.modules.contacts.next.records.NewRecord
import expo.modules.contacts.next.records.PatchRecord
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Required
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.types.ValueOrUndefined

sealed interface PhoneRecord {
  @OptimizedRecord
  data class Existing(
    @Required @Field override val id: String,
    @Field val label: String? = null,
    @Field val number: String? = null
  ) : ExistingRecord

  @OptimizedRecord
  data class New(
    @Field val label: String? = null,
    @Field val number: String? = null
  ) : NewRecord

  @OptimizedRecord
  class Patch : PatchRecord {
    @Required @Field
    override lateinit var id: String

    @Field val label: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()

    @Field val number: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()
  }
}
