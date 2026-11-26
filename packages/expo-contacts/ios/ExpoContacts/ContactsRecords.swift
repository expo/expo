import ExpoModulesCore

struct ContactsQuery: Record {
  @Field var pageSize: Int?
  @Field var pageOffset: Int?
  @Field var fields: [String]?
  @Field var sort: String?
  @Field var name: String?
  @Field var id: [String]?
  @Field var groupId: String?
  @Field var containerId: String?
  @Field var rawContacts: Bool?
}

struct ContainerQuery: Record {
  @Field var contactId: String?
  @Field var groupId: String?
  @Field var containerId: [String]?
}

struct GroupQuery: Record {
  @Field var groupId: String?
  @Field var groupName: String?
  @Field var containerId: String?
}

struct Contact: Record {
  @Field var id: String?
  @Field var contactType: String
  @Field var name: String
  @Field var firstName: String?
  @Field var middleName: String?
  @Field var lastName: String?
  @Field var maidenName: String?
  @Field var namePrefix: String?
  @Field var nameSuffix: String?
  @Field var nickname: String?
  @Field var phoneticFirstName: String?
  @Field var phoneticMiddleName: String?
  @Field var phoneticLastName: String?
  @Field var company: String?
  @Field var jobTitle: String?
  @Field var department: String?
  @Field var note: String?
  @Field var imageAvailable: Bool?
  @Field var image: Image?
  @Field var rawImage: Image?
  @Field var birthday: ContactDate?
  @Field var dates: [ContactDate]?
  @Field var relationships: [Relationship]?
  @Field var emails: [Email]?
  @Field var phoneNumbers: [PhoneNumber]?
  @Field var addresses: [Address]?
  @Field var instantMessageAddresses: [InstantMessageAddress]?
  @Field var urlAddresses: [UrlAddress]?
  @Field var nonGregorianBirthday: ContactDate?
  @Field var socialProfiles: [SocialProfile]?
}

struct SocialProfile: Record {
  @Field var service: String?
  @Field var localizedProfile: String?
  @Field var url: URL?
  @Field var username: String?
  @Field var userId: String?
  @Field var label: String
  @Field var id: String?
}

struct InstantMessageAddress: Record {
  @Field var service: String?
  @Field var username: String?
  @Field var localizedService: String?
  @Field var label: String
  @Field var id: String?
}

struct UrlAddress: Record {
  @Field var label: String
  @Field var url: URL?
  @Field var id: String?
}

struct Email: Record {
  @Field var email: String?
  @Field var isPrimary: Bool?
  @Field var label: String
  @Field var id: String?
}

struct PhoneNumber: Record {
  @Field var number: String?
  @Field var isPrimary: Bool?
  @Field var digits: String?
  @Field var countryCode: String?
  @Field var label: String
  @Field var id: String?
}

struct Address: Record {
  @Field var street: String?
  @Field var city: String?
  @Field var country: String?
  @Field var region: String?
  @Field var neighborhood: String?
  @Field var postalCode: String?
  @Field var poBox: String?
  @Field var isoCountryCode: String?
  @Field var label: String
  @Field var id: String?
}

struct Relationship: Record {
  @Field var label: String
  @Field var name: String?
  @Field var id: String?
}

struct ContactDate: Record {
  @Field var day: Int?
  @Field var month: Int?
  @Field var year: Int?
  @Field var id: String?
  @Field var label: String
  @Field var format: String?
}

struct Image: Record {
  @Field var uri: String?
  @Field var width: Int?
  @Field var height: Int?
  @Field var base64: String?
}

struct FormOptions: Record {
  @Field var displayedPropertyKeys: [String]?
  @Field var message: String?
  @Field var alternateName: String?
  @Field var allowsEditing: Bool?
  @Field var allowsActions: Bool?
  @Field var shouldShowLinkedContacts: Bool?
  @Field var isNew: Bool?
  @Field var cancelButtonTitle: String?
  @Field var preventAnimation: Bool?
  @Field var groupId: String?
}
