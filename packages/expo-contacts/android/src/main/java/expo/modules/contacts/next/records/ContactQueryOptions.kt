package expo.modules.contacts.next.records

import android.provider.ContactsContract
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

class ContactQueryOptions : Record {
  @Field val limit: Int? = null

  @Field val offset: Int? = null

  @Field val name: String? = null

  @Field val sortOrder: SortOrder? = null
}

enum class SortOrder(val value: String) : Enumerable {
  UserDefault("userDefault"),
  GivenName("givenName"),
  FamilyName("familyName"),
  None("none");

  fun toColumn(): String? =
    when (this) {
      GivenName -> ContactsContract.Contacts.SORT_KEY_PRIMARY
      FamilyName -> ContactsContract.Contacts.SORT_KEY_ALTERNATIVE
      None, UserDefault -> null
    }
}
