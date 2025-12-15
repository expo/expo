import Contacts
import ExpoModulesCore

class ContactPatcher {
  private let imageMapper: ImageMapper
  
  init(imageMapper: ImageMapper) {
    self.imageMapper = imageMapper
  }
  
  func apply(
    patch: PatchContactRecord,
    to contact: inout CNMutableContact
  ) throws {
    try apply(patch: patch.givenName, to: &contact, mapper: StringMapper(descriptor: CNContactGivenNameKey, keyPath: \.givenName))
    try apply(patch: patch.middleName, to: &contact, mapper: StringMapper(descriptor: CNContactMiddleNameKey, keyPath: \.middleName))
    try apply(patch: patch.familyName, to: &contact, mapper: StringMapper(descriptor: CNContactFamilyNameKey, keyPath: \.familyName))
    try apply(patch: patch.maidenName, to: &contact, mapper: StringMapper(descriptor: CNContactPreviousFamilyNameKey, keyPath: \.previousFamilyName))
    try apply(patch: patch.nickname, to: &contact, mapper: StringMapper(descriptor: CNContactNicknameKey, keyPath: \.nickname))
    try apply(patch: patch.prefix, to: &contact, mapper: StringMapper(descriptor: CNContactNamePrefixKey, keyPath: \.namePrefix))
    try apply(patch: patch.suffix, to: &contact, mapper: StringMapper(descriptor: CNContactNameSuffixKey, keyPath: \.nameSuffix))
    
    try apply(patch: patch.company, to: &contact, mapper: StringMapper(descriptor: CNContactOrganizationNameKey, keyPath: \.organizationName))
    try apply(patch: patch.jobTitle, to: &contact, mapper: StringMapper(descriptor: CNContactJobTitleKey, keyPath: \.jobTitle))
    try apply(patch: patch.department, to: &contact, mapper: StringMapper(descriptor: CNContactDepartmentNameKey, keyPath: \.departmentName))
    
    try apply(patch: patch.phoneticGivenName, to: &contact, mapper: StringMapper(descriptor: CNContactPhoneticGivenNameKey, keyPath: \.phoneticGivenName))
    try apply(patch: patch.phoneticMiddleName, to: &contact, mapper: StringMapper(descriptor: CNContactPhoneticMiddleNameKey, keyPath: \.phoneticMiddleName))
    try apply(patch: patch.phoneticFamilyName, to: &contact, mapper: StringMapper(descriptor: CNContactPhoneticFamilyNameKey, keyPath: \.phoneticFamilyName))
    try apply(patch: patch.phoneticCompanyName, to: &contact, mapper: StringMapper(descriptor: CNContactPhoneticOrganizationNameKey, keyPath: \.phoneticOrganizationName))
    
    try apply(patch: patch.note, to: &contact, mapper: StringMapper(descriptor: CNContactNoteKey, keyPath: \.note))
    
    try apply(patch: patch.birthday, to: &contact, mapper: ContactDateMapper())
    try apply(patch: patch.nonGregorianBirthday, to: &contact, mapper: NonGregorianBirthdayMapper())
    
    try apply(patch: patch.image, to: &contact, mapper: imageMapper)

    try apply(patches: patch.emails, keyPath: \.emailAddresses, mapper: EmailMapper(), on: &contact)
    try apply(patches: patch.phones, keyPath: \.phoneNumbers, mapper: PhoneMapper(), on: &contact)
    try apply(patches: patch.dates, keyPath: \.dates, mapper: DateMapper(), on: &contact)
    try apply(patches: patch.addresses, keyPath: \.postalAddresses, mapper: PostalAddressMapper(), on: &contact)
    try apply(patches: patch.relations, keyPath: \.contactRelations, mapper: RelationMapper(), on: &contact)
    try apply(patches: patch.urlAddresses, keyPath: \.urlAddresses, mapper: UrlAddressMapper(), on: &contact)
    try apply(patches: patch.socialProfiles, keyPath: \.socialProfiles, mapper: SocialProfileMapper(), on: &contact)
    try apply(patches: patch.imAddresses, keyPath: \.instantMessageAddresses, mapper: ImAddressMapper(), on: &contact)
  }
  
  private func apply<Mapper: PropertyMapper>(
    patch: ValueOrUndefined<Mapper.TDto>,
    to contact: inout CNMutableContact,
    mapper: Mapper
  ) throws {
    if case .value(let value) = patch {
      try mapper.apply(value, to: contact)
    }
  }
  
  private func apply<Mapper: ContactRecordMapper>(
    patches: ValueOrUndefined<[Either<Mapper.TPatchRecord, Mapper.TNewRecord>]?>,
    keyPath: WritableKeyPath<CNMutableContact, [CNLabeledValue<Mapper.TDomainValue>]>,
    mapper: Mapper,
    on contact: inout CNMutableContact
  ) throws {
    guard case .value(let list) = patches else {
      return
    }
    
    guard let list = list else {
      contact[keyPath: keyPath] = []
      return
    }
    
    let (patchRecords, newRecords) = try splitPatchAndNewRecords(list)
    let newItems = try newRecords.map { try mapper.newRecordToCNLabeledValue($0) }
    
    let existingItems = contact[keyPath: keyPath]
    let modifiedItems = try applyPatches(to: existingItems, with: patchRecords, mapper: mapper)
    
    contact[keyPath: keyPath] = modifiedItems + newItems
  }
  
  private func splitPatchAndNewRecords<Patch: Record, New: Record>(
    _ records: [Either<Patch, New>]
  ) throws -> (patches: [Patch], new: [New]) {
    return try records.reduce(into: (patches: [Patch](), new: [New]())) { result, entry in
      if entry.`is`(Patch.self) {
        let patch = try entry.`as`(Patch.self)
        result.patches.append(patch)
      } else {
        let newRecord = try entry.`as`(New.self)
        result.new.append(newRecord)
      }
    }
  }
  
  private func applyPatches<Mapper: ContactRecordMapper>(
    to existing: [CNLabeledValue<Mapper.TDomainValue>],
    with patches: [Mapper.TPatchRecord],
    mapper: Mapper
  ) throws -> [CNLabeledValue<Mapper.TDomainValue>] {
    let patchRecordsById = Dictionary(uniqueKeysWithValues: patches.map { ($0.id, $0) })
    
    return try existing.compactMap { item in
      guard let patchForItem = patchRecordsById[item.identifier] else {
        return nil
      }
      return try mapper.apply(patch: patchForItem, to: item)
    }
  }
}
