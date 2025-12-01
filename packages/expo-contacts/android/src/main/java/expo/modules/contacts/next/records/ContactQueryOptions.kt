package expo.modules.contacts.next.records

import android.provider.ContactsContract
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

class ContactQueryOptions: Record{
  @Field val limit: Int? = null
  @Field val offset: Int? = null
  @Field val name: String? = null
  @Field val sortOrder: SortOrder? = SortOrder.UserDefault
}

enum class SortOrder(val value: String): Enumerable {
  UserDefault("userDefault"),
  GivenName("givenName"),
  FamilyName("familyName"),
  None("none");

  fun toColumn(): String? =
    when(this) {
      GivenName -> ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME
      FamilyName -> ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME
      None, UserDefault -> null
    }
}