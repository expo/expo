package expo.modules.contacts.next.records.fields

import expo.modules.contacts.next.records.ExistingRecord
import expo.modules.contacts.next.records.NewRecord
import expo.modules.contacts.next.records.PatchRecord
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Required
import expo.modules.kotlin.types.ValueOrUndefined

sealed interface PhoneRecord {
  data class Existing(
    @Required @Field override val id: String,
    @Field val label: String? = null,
    @Field val number: String? = null,
    @Field val countryCode: String? = null,
    @Field val digits: String? = null
  ) : ExistingRecord

  data class New(
    @Field val label: String? = null,
    @Field val number: String? = null,
    @Field val countryCode: String? = null,
    @Field val digits: String? = null
  ) : NewRecord

  data class Patch(
    @Required @Field override val id: String,
    @Field val label: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
    @Field val number: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
    @Field val countryCode: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
    @Field val digits: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()
  ) : PatchRecord
}
