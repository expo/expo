import ExpoModulesCore

struct CreateContactRecord: Record {
  @Field var givenName: String?
  @Field var middleName: String?
  @Field var familyName: String?
  @Field var maidenName: String?
  @Field var nickname: String?
  @Field var prefix: String?
  @Field var suffix: String?
  @Field var phoneticGivenName: String?
  @Field var phoneticMiddleName: String?
  @Field var phoneticFamilyName: String?
  @Field var company: String?
  @Field var department: String?
  @Field var jobTitle: String?
  @Field var phoneticOrganizationName:String?
  @Field var note: String?
  @Field var image: String?
  @Field var emails: [NewEmailRecord]?
  @Field var dates: [NewDateRecord]?
  @Field var phones: [NewPhoneRecord]?
  @Field var addresses: [NewPostalAddressRecord]?
  @Field var relations: [NewRelationRecord]?
  @Field var urlAddresses: [NewUrlAddressRecord]?
  @Field var imAddresses: [NewImAddressRecord]?
  @Field var socialProfiles: [NewSocialProfileRecord]?
}
