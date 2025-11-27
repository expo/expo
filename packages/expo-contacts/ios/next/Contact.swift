import ExpoModulesCore
import Contacts

class ContactNext: SharedObject {
  let id: String
  private let contactRepository: ContactRepository
  private let imageService: ImageService
  private let imageMapper: ImageMapper
  private let thumbnailMapper: ImageMapper
  
  init(
    id: String,
    contactRepository: ContactRepository,
    imageService: ImageService
  ) {
    self.id = id
    self.contactRepository = contactRepository
    self.imageService = imageService
    self.imageMapper = ImageMapper(
      service: imageService,
      filename: "\(id)-\(CNContactImageDataKey).png"
    )
    
    self.thumbnailMapper = ImageMapper(
      service: imageService,
      filename: "\(id)-\(CNContactThumbnailImageDataKey).png"
    )
  }

  private lazy var properties = PropertyFactory(
    contactId: id,
    contactRepository: contactRepository
  )

  lazy var givenName = properties.make(.givenName, mapper: StringMapper())
  lazy var middleName = properties.make(.middleName, mapper: StringMapper())
  lazy var familyName = properties.make(.familyName, mapper: StringMapper())
  lazy var nickname = properties.make(.nickname, mapper: StringMapper())
  lazy var maidenName = properties.make(.previousFamilyName, mapper: StringMapper())
  lazy var prefix = properties.make(.namePrefix, mapper: StringMapper())
  lazy var suffix = properties.make(.nameSuffix, mapper: StringMapper())
  lazy var phoneticGivenName = properties.make(.phoneticGivenName, mapper: StringMapper())
  lazy var phoneticMiddleName = properties.make(.phoneticMiddleName, mapper: StringMapper())
  lazy var phoneticFamilyName = properties.make(.phoneticFamilyName, mapper: StringMapper())
  lazy var company = properties.make(.organizationName, mapper: StringMapper())
  lazy var jobTitle = properties.make(.jobTitle, mapper: StringMapper())
  lazy var department = properties.make(.departmentName, mapper: StringMapper())
  lazy var phoneticCompanyName = properties.make(.phoneticOrganizationName, mapper: StringMapper())
  lazy var note = properties.make(.note, mapper: StringMapper())
  lazy var birthday = properties.make(.birthday, mapper: ContactDateMapper())
  lazy var nonGregorianBirthday = properties.make(.nonGregorianBirthday, mapper: NonGregorianBirthdayMapper())
  lazy var image = properties.make(.imageData, mapper: imageMapper)
  lazy var thumbnail = properties.make(.thumbnailImageData, mapper: thumbnailMapper)
  lazy var emails = properties.makeList(.emailAddresses, mapper: EmailMapper())
  lazy var phones = properties.makeList(.phoneNumbers, mapper: PhoneMapper())
  lazy var dates = properties.makeList(.dates, mapper: DateMapper())
  lazy var addresses = properties.makeList(.postalAddresses, mapper: PostalAddressMapper())
  lazy var relations = properties.makeList(.relations, mapper: RelationMapper())
  lazy var urlAddresses = properties.makeList(.urlAddresses, mapper: UrlAddressMapper())
  lazy var socialProfiles = properties.makeList(.socialProfiles, mapper: SocialProfileMapper())
  lazy var imAddresses = properties.makeList(.instantMessageAddresses, mapper: ImAddressMapper())

  func getFullName() throws -> String {
    let keys = CNContactFormatter.descriptorForRequiredKeys(for: .fullName)
    guard let contact = contactRepository.getById(id: id, keysToFetch: [keys] as [CNKeyDescriptor]) else {
      throw ContactNotFoundException(id)
    }
    return FullNameExtractor.extract(from: contact)
  }

  func delete() async throws -> Bool {
    try contactRepository.delete(id: id)
    return true
  }

  func getDetails(fields: [ContactField]?) throws -> GetContactDetailsRecord {
    let keys = CNKeyDescriptorMapper.map(from: fields ?? ContactField.allCases)
    guard let contact = contactRepository.getById(id: id, keysToFetch: keys) else {
      throw ContactNotFoundException(id)
    }
    return try GetContactDetailsMapper(imageService: imageService)
      .map(contact: contact)
  }

  func patch(_ patchContactRecord: PatchContactRecord) throws {
    let keys = CNKeyDescriptorMapper.map(from: patchContactRecord)
    var mutableContact = try contactRepository.getMutableById(id: id, keysToFetch: keys)
    try ContactPatcher(imageMapper: imageMapper).apply(patch: patchContactRecord, to: &mutableContact)
    try contactRepository.update(contact: mutableContact)
  }

  func update(_ createContactRecord: CreateContactRecord) throws {
    let mutableContact = try contactRepository.getMutableById(
      id: id,
      keysToFetch: CNContact.allUpdatableKeys as [CNKeyDescriptor]
    )
    let contact = try CreateContactMapper(imageService: imageService).toCNMutableContact(createContactRecord)
    CNContact.allUpdatableKeys.forEach {
      mutableContact.setValue(contact.value(forKey: $0), forKey: $0)
    }
    try contactRepository.update(contact: mutableContact)
  }
  
  static func getAll(
    queryOptions: ContactQueryOptions?,
    contactRepository: ContactRepository,
    contactFactory: ContactFactory
  ) throws -> [ContactNext] {
    return try contactRepository.getPaginated(
      keysToFetch: [CNContactIdentifierKey as CNKeyDescriptor],
      predicate: queryOptions?.name.map {
        CNContact.predicateForContacts(matchingName: $0)
      },
      limit: queryOptions?.limit,
      offset: queryOptions?.offset,
      sortOrder: queryOptions?.sortOrder.map {
        CNContactSortOrderMapper.map($0)
      }
    ).map { contactFactory.create(id: $0.identifier) }
  }

  static func getAllDetails(
    fields: [ContactField]?,
    queryOptions: ContactQueryOptions?,
    contactRepository: ContactRepository,
    getContactDetailsMapper: GetContactDetailsMapper
  ) throws -> [GetContactDetailsRecord] {
    return try contactRepository.getPaginated(
      keysToFetch: CNKeyDescriptorMapper.map(from: fields ?? ContactField.allCases),
      predicate: queryOptions?.name.map {
        CNContact.predicateForContacts(matchingName: $0)
      },
      limit: queryOptions?.limit,
      offset: queryOptions?.offset,
      sortOrder: queryOptions?.sortOrder.map {
        CNContactSortOrderMapper.map($0)
      }
    ).map { try getContactDetailsMapper.map(contact: $0) }
  }
  
  static func create(
    createContactRecord: CreateContactRecord,
    contactRepository: ContactRepository,
    imageService: ImageService,
    contactFactory: ContactFactory
  ) throws -> ContactNext {
    let contact = try CreateContactMapper(imageService: imageService).toCNMutableContact(createContactRecord)
    try contactRepository.insert(contact: contact)
    return contactFactory.create(id: contact.identifier)
  }
}
