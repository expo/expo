package expo.modules.contacts.next.records.contact

import expo.modules.contacts.next.records.fields.DateRecord
import expo.modules.contacts.next.records.fields.EmailRecord
import expo.modules.contacts.next.records.fields.ExtraNameRecord
import expo.modules.contacts.next.records.fields.PhoneRecord
import expo.modules.contacts.next.records.fields.PostalAddressRecord
import expo.modules.contacts.next.records.fields.RelationRecord
import expo.modules.contacts.next.records.fields.UrlAddressRecord
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.ValueOrUndefined

@OptIn(EitherType::class)
data class PatchContactRecord(
  @Field val givenName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val middleName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val familyName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val prefix: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val suffix: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val phoneticGivenName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val phoneticMiddleName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val phoneticFamilyName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val company: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val department: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val jobTitle: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val phoneticOrganizationName: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val note: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val emails: ValueOrUndefined<List<Either<EmailRecord.Patch, EmailRecord.New>>?> = ValueOrUndefined.Undefined(),
  @Field val phones: ValueOrUndefined<List<Either<PhoneRecord.Patch, PhoneRecord.New>>?> = ValueOrUndefined.Undefined(),
  @Field val dates: ValueOrUndefined<List<Either<DateRecord.Patch, DateRecord.New>>?> = ValueOrUndefined.Undefined(),
  @Field val postalAddresses: ValueOrUndefined<List<Either<PostalAddressRecord.Patch, PostalAddressRecord.New>>?> = ValueOrUndefined.Undefined(),
  @Field val relationships: ValueOrUndefined<List<Either<RelationRecord.Patch, RelationRecord.New>>?> = ValueOrUndefined.Undefined(),
  @Field val urlAddresses: ValueOrUndefined<List<Either<UrlAddressRecord.Patch, UrlAddressRecord.New>>?> = ValueOrUndefined.Undefined(),
  @Field val extraNames: ValueOrUndefined<List<Either<ExtraNameRecord.Patch, ExtraNameRecord.New>>?> = ValueOrUndefined.Undefined()
) : Record
