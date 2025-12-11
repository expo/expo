import ExpoModulesCore

struct GetContactDetailsRecord: Record {
  @Field var id: String
  @Field var fullName: String?
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
  @Field var phoneticCompanyName: String?
  @Field var note: String?
  @Field var image: String?
  @Field var thumbnail: String?
  @Field var birthday: ContactDateNext?
  @Field var nonGregorianBirthday: NonGregorianBirthday?
  @Field var emails: [ExistingEmailRecord]?
  @Field var dates: [ExistingDateRecord]?
  @Field var phones: [ExistingPhoneRecord]?
  @Field var addresses: [ExistingPostalAddressRecord]?
  @Field var relations: [ExistingRelationRecord]?
  @Field var urlAddresses: [ExistingUrlAddressRecord]?
  @Field var imAddresses: [ExistingImAddressRecord]?
  @Field var socialProfiles: [ExistingSocialProfileRecord]?
  
  init() {}
  
  init(
    id: String,
    fullName: String? = nil,
    givenName: String? = nil,
    middleName: String? = nil,
    familyName: String? = nil,
    maidenName: String? = nil,
    nickname: String? = nil,
    prefix: String? = nil,
    suffix: String? = nil,
    phoneticGivenName: String? = nil,
    phoneticMiddleName: String? = nil,
    phoneticFamilyName: String? = nil,
    company: String? = nil,
    department: String? = nil,
    jobTitle: String? = nil,
    phoneticCompanyName: String? = nil,
    note: String? = nil,
    image: String? = nil,
    thumbnail: String? =  nil,
    birthday: ContactDateNext? = nil,
    nonGregorianBirthday: NonGregorianBirthday? = nil,
    emails: [ExistingEmailRecord]? = nil,
    dates: [ExistingDateRecord]? = nil,
    phones: [ExistingPhoneRecord]? = nil,
    addresses: [ExistingPostalAddressRecord]? = nil,
    relations: [ExistingRelationRecord]? = nil,
    urlAddresses: [ExistingUrlAddressRecord]? = nil,
    imAddresses: [ExistingImAddressRecord]? = nil,
    socialProfiles: [ExistingSocialProfileRecord]? = nil
  ) {
    self.id = id
    self.fullName = fullName
    self.givenName = givenName
    self.middleName = middleName
    self.familyName = familyName
    self.maidenName = maidenName
    self.nickname = nickname
    self.prefix = prefix
    self.suffix = suffix
    self.phoneticGivenName = phoneticGivenName
    self.phoneticMiddleName = phoneticMiddleName
    self.phoneticFamilyName = phoneticFamilyName
    self.company = company
    self.department = department
    self.jobTitle = jobTitle
    self.phoneticCompanyName = phoneticCompanyName
    self.note = note
    self.image = image
    self.emails = emails
    self.dates = dates
    self.phones = phones
    self.addresses = addresses
    self.relations = relations
    self.urlAddresses = urlAddresses
    self.imAddresses = imAddresses
    self.socialProfiles = socialProfiles
  }
}
