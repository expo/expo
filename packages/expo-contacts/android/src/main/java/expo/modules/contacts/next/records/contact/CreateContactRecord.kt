package expo.modules.contacts.next.records.contact

import expo.modules.contacts.next.domain.model.headers.isfavourite.PatchIsFavourite
import expo.modules.contacts.next.records.fields.DateRecord
import expo.modules.contacts.next.records.fields.EmailRecord
import expo.modules.contacts.next.records.fields.ExtraNameRecord
import expo.modules.contacts.next.records.fields.PhoneRecord
import expo.modules.contacts.next.records.fields.PostalAddressRecord
import expo.modules.contacts.next.records.fields.RelationRecord
import expo.modules.contacts.next.records.fields.UrlAddressRecord
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class CreateContactRecord(
  @Field val displayName: String? = null,
  @Field val givenName: String? = null,
  @Field val middleName: String? = null,
  @Field val familyName: String? = null,
  @Field val prefix: String? = null,
  @Field val suffix: String? = null,
  @Field val phoneticGivenName: String? = null,
  @Field val phoneticMiddleName: String? = null,
  @Field val phoneticFamilyName: String? = null,
  @Field val company: String? = null,
  @Field val department: String? = null,
  @Field val jobTitle: String? = null,
  @Field val phoneticOrganizationName: String? = null,
  @Field val note: String? = null,
  @Field val isFavourite: Boolean = false,
  @Field val image: String? = null,
  @Field val emails: List<EmailRecord.New>? = listOf(),
  @Field val dates: List<DateRecord.New>? = listOf(),
  @Field val phones: List<PhoneRecord.New>? = listOf(),
  @Field val addresses: List<PostalAddressRecord.New>? = listOf(),
  @Field val relations: List<RelationRecord.New>? = listOf(),
  @Field val urlAddresses: List<UrlAddressRecord.New>? = listOf(),
  @Field val extraNames: List<ExtraNameRecord.New>? = listOf()
) : Record
