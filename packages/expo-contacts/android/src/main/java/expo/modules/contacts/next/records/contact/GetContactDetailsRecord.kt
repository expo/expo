package expo.modules.contacts.next.records.contact

import expo.modules.contacts.next.records.fields.DateRecord
import expo.modules.contacts.next.records.fields.EmailRecord
import expo.modules.contacts.next.records.fields.ExtraNameRecord
import expo.modules.contacts.next.records.fields.PhoneRecord
import expo.modules.contacts.next.records.fields.PostalAddressRecord
import expo.modules.contacts.next.records.fields.RelationshipRecord
import expo.modules.contacts.next.records.fields.UrlAddressRecord
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class GetContactDetailsRecord(
  @Field val contactId: String,
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
  @Field val note: String? = null,
  @Field val emails: List<EmailRecord.Existing>? = listOf(),
  @Field val dates: List<DateRecord.Existing>? = listOf(),
  @Field val phones: List<PhoneRecord.Existing>? = listOf(),
  @Field val addresses: List<PostalAddressRecord.Existing>? = listOf(),
  @Field val relationships: List<RelationshipRecord.Existing>? = listOf(),
  @Field val urlAddresses: List<UrlAddressRecord.Existing>? = listOf(),
  @Field val extraNames: List<ExtraNameRecord.Existing>? = listOf()
) : Record
