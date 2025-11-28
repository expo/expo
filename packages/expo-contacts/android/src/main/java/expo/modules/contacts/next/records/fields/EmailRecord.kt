package expo.modules.contacts.next.records.fields

import expo.modules.contacts.next.records.ExistingRecord
import expo.modules.contacts.next.records.NewRecord
import expo.modules.contacts.next.records.PatchRecord
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Required
import expo.modules.kotlin.types.ValueOrUndefined

sealed interface EmailRecord {
  data class Existing(
    @Required @Field override val id: String,
    @Field val label: String? = null,
    @Field val address: String? = null
  ) : ExistingRecord

  data class New(
    @Field val label: String? = null,
    @Field val address: String? = null
  ) : NewRecord

  data class Patch(
    @Required @Field override val id: String,
    @Field val label: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
    @Field val address: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()
  ) : PatchRecord
}
