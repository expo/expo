import ExpoModulesCore

struct PatchContactRecord: Record {
  @Field var givenName: ValueOrUndefined<String?> = .undefined
  @Field var middleName: ValueOrUndefined<String?> = .undefined
  @Field var familyName: ValueOrUndefined<String?> = .undefined
  @Field var maidenName: ValueOrUndefined<String?> = .undefined
  @Field var nickname: ValueOrUndefined<String?> = .undefined
  @Field var prefix: ValueOrUndefined<String?> = .undefined
  @Field var suffix: ValueOrUndefined<String?> = .undefined
  @Field var phoneticGivenName: ValueOrUndefined<String?> = .undefined
  @Field var phoneticMiddleName: ValueOrUndefined<String?> = .undefined
  @Field var phoneticFamilyName: ValueOrUndefined<String?> = .undefined
  @Field var company: ValueOrUndefined<String?> = .undefined
  @Field var department: ValueOrUndefined<String?> = .undefined
  @Field var jobTitle: ValueOrUndefined<String?> = .undefined
  @Field var phoneticCompanyName: ValueOrUndefined<String?> = .undefined
  @Field var note: ValueOrUndefined<String?> = .undefined
  @Field var image: ValueOrUndefined<String?> = .undefined
  @Field var birthday: ValueOrUndefined<ContactDateNext?>  = .undefined
  @Field var nonGregorianBirthday: ValueOrUndefined<NonGregorianBirthday?>  = .undefined
  @Field var emails: ValueOrUndefined<[Either<PatchEmailRecord, NewEmailRecord>]?> = .undefined
  @Field var phones: ValueOrUndefined<[Either<PatchPhoneRecord, NewPhoneRecord>]?> = .undefined
  @Field var dates: ValueOrUndefined<[Either<PatchDateRecord, NewDateRecord>]?> = .undefined
  @Field var addresses: ValueOrUndefined<[Either<PatchPostalAddressRecord, NewPostalAddressRecord>]?> = .undefined
  @Field var relations: ValueOrUndefined<[Either<PatchRelationRecord, NewRelationRecord>]?> = .undefined
  @Field var urlAddresses: ValueOrUndefined<[Either<PatchUrlAddressRecord, NewUrlAddressRecord>]?> = .undefined
  @Field var imAddresses: ValueOrUndefined<[Either<PatchImAddressRecord, NewImAddressRecord>]?> = .undefined
  @Field var socialProfiles: ValueOrUndefined<[Either<PatchSocialProfileRecord, NewSocialProfileRecord>]?> = .undefined
}
