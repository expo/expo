package expo.modules.contacts.next.records.fields

import expo.modules.contacts.next.records.ExistingRecord
import expo.modules.contacts.next.records.NewRecord
import expo.modules.contacts.next.records.PatchRecord
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required
import expo.modules.kotlin.types.ValueOrUndefined

sealed interface DateRecord {
  data class Existing(
    @Required @Field override val id: String,
    @Field val label: String? = null,
    @Field val date: ContactDateRecord? = null
  ) : ExistingRecord

  data class New(
    @Field val label: String? = null,
    @Field val date: ContactDateRecord? = null
  ) : NewRecord

  class Patch() : PatchRecord {
    @Required @Field
    override lateinit var id: String

    @Field val label: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()

    @Field val date: ValueOrUndefined<ContactDateRecord?> = ValueOrUndefined.Undefined()
  }

  data class ContactDateRecord(
    @Field val year: String? = null,
    @Required @Field val month: String,
    @Required @Field val day: String
  ) : Record
}
