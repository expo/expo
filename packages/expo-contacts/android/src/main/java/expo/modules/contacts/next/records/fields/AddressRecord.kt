package expo.modules.contacts.next.records.fields

import expo.modules.contacts.next.records.ExistingRecord
import expo.modules.contacts.next.records.NewRecord
import expo.modules.contacts.next.records.PatchRecord
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Required
import expo.modules.kotlin.types.ValueOrUndefined

sealed interface AddressRecord {
  data class Existing(
    @Required @Field override val id: String,
    @Field val label: String? = null,
    @Field val street: String? = null,
    @Field val city: String? = null,
    @Field val region: String? = null,
    @Field val postcode: String? = null,
    @Field val country: String? = null,
    @Field val state: String? = null,
    @Field val neighborhood: String? = null,
    @Field val poBox: String? = null,
    @Field val formattedAddress: String? = null
  ) : ExistingRecord

  data class New(
    @Field val label: String? = null,
    @Field val street: String? = null,
    @Field val city: String? = null,
    @Field val region: String? = null,
    @Field val postcode: String? = null,
    @Field val country: String? = null,
    @Field val state: String? = null,
    @Field val neighborhood: String? = null,
    @Field val poBox: String? = null,
    @Field val formattedAddress: String? = null
  ) : NewRecord

  data class Patch(
    @Required @Field override val id: String,
    @Field val label: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
    @Field val street: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
    @Field val city: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
    @Field val region: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
    @Field val postcode: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
    @Field val country: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
    @Field val state: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
    @Field val neighborhood: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
    @Field val poBox: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
    @Field val formattedAddress: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()
  ) : PatchRecord
}
