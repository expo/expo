import Contacts
import ContactsUI

func decodeAddresses(_ input: [Address]?) -> [CNLabeledValue<CNPostalAddress>]? {
  guard let input = input else {
    return nil
  }

  var output = [CNLabeledValue<CNMutablePostalAddress>]()
  for item in input {
    let label = decodeLabel(label: item.label)
    if let street = item.street {
      let address = CNMutablePostalAddress()
      address.street = street
      address.postalCode = item.postalCode ?? ""
      address.city = item.city ?? ""
      address.country = item.country ?? ""
      address.state = item.region ?? ""
      address.isoCountryCode = item.isoCountryCode ?? ""

      let labeledValue = CNLabeledValue(label: label, value: address)
      output.append(labeledValue)
    }
  }

  return output.isEmpty ? nil : output as? [CNLabeledValue<CNPostalAddress>]
}

func decodePhoneNumbers(_ input: [PhoneNumber]?) -> [CNLabeledValue<CNPhoneNumber>]? {
  guard let input else {
    return nil
  }

  var output = [CNLabeledValue<CNPhoneNumber>]()
  for item in input {
    let label = decodePhoneLabel(item.label)

    if let phoneNumber = item.number {
      let number = CNPhoneNumber(stringValue: phoneNumber)
      let labeledNumber = CNLabeledValue(label: label, value: number)
      output.append(labeledNumber)
    }
  }
  return output
}

func decodePhoneLabel(_ label: String?) -> String? {
  guard let label = label else {
    return nil
  }

  var decodedLabel = decodeLabel(label: label)
  switch decodedLabel {
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelPhoneNumberMain):
    return CNLabelPhoneNumberMain
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelPhoneNumberPager):
    return CNLabelPhoneNumberPager
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelPhoneNumberiPhone):
    return CNLabelPhoneNumberiPhone
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelPhoneNumberMobile):
    return CNLabelPhoneNumberMobile
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelPhoneNumberHomeFax):
    return CNLabelPhoneNumberHomeFax
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelPhoneNumberWorkFax):
    return CNLabelPhoneNumberWorkFax
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelPhoneNumberOtherFax):
    return CNLabelPhoneNumberOtherFax
  default:
    return decodedLabel
  }
}

func decodeLabel(label: String?) -> String {
  guard let label, !label.isEmpty else {
    return "default"
  }
  var mutableLabel = label

  if label == CNLabeledValue<NSString>.localizedString(forLabel: CNLabelHome) {
    mutableLabel = CNLabelHome
  } else if label == CNLabeledValue<NSString>.localizedString(forLabel: CNLabelWork) {
    mutableLabel = CNLabelWork
  } else if label == CNLabeledValue<NSString>.localizedString(forLabel: CNLabelOther) {
    mutableLabel = CNLabelOther
  }

  return mutableLabel
}

func decodeBirthday(_ input: ContactDate?, contact: CNContact) -> DateComponents? {
  guard let input = input else {
    return contact.birthday
  }

  var components = contact.birthday ?? DateComponents()

  if let month = input.month {
    components.month = month + 1
  }
  if let year = input.year {
    components.year = year
  }
  if let day = input.day {
    components.day = day
  }
  if let format = input.format {
  }

  return components
}

func contactKeysToFetch(from fields: [String]?) -> [String] {
  let mapping: [String: String] = [
    "id": CNContactIdentifierKey,
    "contactType": CNContactTypeKey,
    "addresses": CNContactPostalAddressesKey,
    "phoneNumbers": CNContactPhoneNumbersKey,
    "emails": CNContactEmailAddressesKey,
    "firstName": CNContactGivenNameKey,
    "middleName": CNContactMiddleNameKey,
    "lastName": CNContactFamilyNameKey,
    "namePrefix": CNContactNamePrefixKey,
    "nameSuffix": CNContactNameSuffixKey,
    "nickname": CNContactNicknameKey,
    "phoneticFirstName": CNContactPhoneticGivenNameKey,
    "phoneticMiddleName": CNContactPhoneticMiddleNameKey,
    "phoneticLastName": CNContactPhoneticFamilyNameKey,
    "maidenName": CNContactPreviousFamilyNameKey,
    "birthday": CNContactBirthdayKey,
    "nonGregorianBirthday": CNContactNonGregorianBirthdayKey,
    "imageAvailable": CNContactImageDataAvailableKey,
    "rawImage": CNContactImageDataKey,
    "image": CNContactThumbnailImageDataKey,
    "note": CNContactNoteKey,
    "company": CNContactOrganizationNameKey,
    "jobTitle": CNContactJobTitleKey,
    "department": CNContactDepartmentNameKey,
    "socialProfiles": CNContactSocialProfilesKey,
    "instantMessageAddresses": CNContactInstantMessageAddressesKey,
    "urlAddresses": CNContactUrlAddressesKey,
    "dates": CNContactDatesKey,
    "relationships": CNContactRelationsKey
  ]

  var results = [String]()

  var updatedFields = fields ?? []

  if fields == nil {
    updatedFields = Array(mapping.keys)

    // On iOS 13 and above, to request contact's note your app must have the `com.apple.developer.contacts.notes` entitlement.
    // You must contact Apple and receive approval for this entitlement.
    updatedFields.removeAll { $0 == "note" }
  } else {
    updatedFields.append(contentsOf: [
      ContactsKey.id,
      ContactsKey.contactType,
      ContactsKey.name,
      ContactsKey.firstName,
      ContactsKey.middleName,
      ContactsKey.lastName,
      ContactsKey.maidenName,
      ContactsKey.nickname,
      ContactsKey.company,
      ContactsKey.jobTitle,
      ContactsKey.department,
      ContactsKey.imageAvailable
    ])

    updatedFields = Array(Set(updatedFields))
  }

  for field in updatedFields {
    if let key = mapping[field] {
      results.append(key)
    } else {
      results.append(field)
    }
  }

  return results
}

func getDescriptors(for fields: [String]?, isWriting: Bool = false) -> [CNKeyDescriptor] {
  let keys = contactKeysToFetch(from: fields)
  var descriptors = keys as [CNKeyDescriptor]
  if isWriting {
    descriptors.append(CNContactVCardSerialization.descriptorForRequiredKeys())
  }

  if keys.contains(ContactsKey.name) {
    descriptors.append(CNContactFormatter.descriptorForRequiredKeys(for: .fullName))
  }
  if keys.contains(ContactsKey.editor) {
    descriptors.append(CNContactViewController.descriptorForRequiredKeys())
  }

  return descriptors
}

func serializeContact(person: CNContact, keys: [String]?, directory: URL?) throws -> [String: Any] {
  var keysToFetch = keys ?? contactKeysToFetch(from: nil)
  var contact = [String: Any]()

  contact[ContactsKey.id] = person.identifier
  contact[ContactsKey.contactType] = person.contactType == .person ? ContactsKey.contactTypePerson : ContactsKey.contactTypeCompany
  contact[ContactsKey.imageAvailable] = person.imageDataAvailable

  if keysToFetch.contains(ContactsKey.name) {
    let name = CNContactFormatter.string(from: person, style: .fullName) ?? ""
    if fieldHasValue(field: name) {
      contact[ContactsKey.name] = name
    }
  }

  if fieldHasValue(field: person.givenName) {
    contact[ContactsKey.firstName] = person.givenName
  }
  if fieldHasValue(field: person.middleName) {
    contact[ContactsKey.middleName] = person.middleName
  }
  if fieldHasValue(field: person.familyName) {
    contact[ContactsKey.lastName] = person.familyName
  }
  if fieldHasValue(field: person.previousFamilyName) {
    contact[ContactsKey.maidenName] = person.previousFamilyName
  }
  if fieldHasValue(field: person.nickname) {
    contact[ContactsKey.nickname] = person.nickname
  }
  if fieldHasValue(field: person.organizationName) {
    contact[ContactsKey.company] = person.organizationName
  }
  if fieldHasValue(field: person.jobTitle) {
    contact[ContactsKey.jobTitle] = person.jobTitle
  }
  if fieldHasValue(field: person.departmentName) {
    contact[ContactsKey.department] = person.departmentName
  }

  if keysToFetch.contains(CNContactNamePrefixKey) && fieldHasValue(field: person.namePrefix) {
  }
  if keysToFetch.contains(CNContactNameSuffixKey) && fieldHasValue(field: person.nameSuffix) {
    contact[ContactsKey.nameSuffix] = person.nameSuffix
  }
  if keysToFetch.contains(CNContactPhoneticGivenNameKey) && fieldHasValue(field: person.phoneticGivenName) {
    contact[ContactsKey.note] = person.phoneticGivenName
  }
  if keysToFetch.contains(CNContactPhoneticMiddleNameKey) && fieldHasValue(field: person.phoneticMiddleName) {
    contact[ContactsKey.note] = person.phoneticMiddleName
  }
  if keysToFetch.contains(CNContactPhoneticFamilyNameKey) && fieldHasValue(field: person.phoneticFamilyName) {
    contact[ContactsKey.phoneticLastName] = person.phoneticFamilyName
  }
  if keysToFetch.contains(CNContactNoteKey) && fieldHasValue(field: person.note) {
    contact[ContactsKey.note] = person.note
  }

  if person.imageDataAvailable {
    if keysToFetch.contains(CNContactImageDataKey) {
      contact[ContactsKey.rawImage] = try writeDataToUri(
        userId: person.identifier,
        data: person.imageData,
        imageKey: CNContactImageDataKey,
        includeBase64: keysToFetch.contains(ContactsKey.rawImageBase64),
        directory: directory)
    }
    if keysToFetch.contains(CNContactThumbnailImageDataKey) {
      contact[ContactsKey.image] = try writeDataToUri(
        userId: person.identifier,
        data: person.thumbnailImageData,
        imageKey: CNContactThumbnailImageDataKey,
        includeBase64: keysToFetch.contains(ContactsKey.imageBase64),
        directory: directory)
    }
  }

  if keysToFetch.contains(CNContactBirthdayKey) {
    contact[ContactsKey.birthday] = birthdayFor(contact: person.birthday)
  }
  if keysToFetch.contains(CNContactNonGregorianBirthdayKey) {
    contact[ContactsKey.nonGregorianBirthday] = birthdayFor(contact: person.nonGregorianBirthday)
  }
  if keysToFetch.contains(CNContactPostalAddressesKey) {
    let values = addressesFor(contact: person)
    if let values {
      contact[ContactsKey.addresses] = values
    }
  }
  if keysToFetch.contains(CNContactPhoneNumbersKey) {
    let values = phoneNumbersFor(contact: person)
    if let values {
      contact[ContactsKey.phoneNumbers] = values
    }
  }
  if keysToFetch.contains(CNContactEmailAddressesKey) {
    let values = emailsFor(contact: person)
    if let values {
      contact[ContactsKey.emails] = values
    }
  }
  if keysToFetch.contains(CNContactSocialProfilesKey) {
    let values = socialProfilesFor(contact: person)
    if let values {
      contact[ContactsKey.socialProfiles] = values
    }
  }
  if keysToFetch.contains(CNContactInstantMessageAddressesKey) {
    let values = socialProfilesFor(contact: person)
    if let values {
      contact[ContactsKey.instantMessageAddresses] = values
    }
  }
  if keysToFetch.contains(CNContactUrlAddressesKey) {
    let values = urlsFor(contact: person)
    if let values {
      contact[ContactsKey.urlAddresses] = values
    }
  }
  if keysToFetch.contains(CNContactDatesKey) {
    let values = datesFor(contact: person)
    if let values {
      contact[ContactsKey.dates] = values
    }
  }
  if keysToFetch.contains(CNContactRelationsKey) {
    let values = relationsFor(contact: person)
    if let values {
      contact[ContactsKey.relationships] = values
    }
  }

  return contact
}

private func writeDataToUri(userId: String, data: Data?, imageKey: String, includeBase64: Bool, directory: URL?) throws -> [String: Any?]? {
  guard let data else {
    return nil
  }
  let image = UIImage(data: data)
  let fileExtension = ".png"

  var fileName = "\(userId)-\(imageKey)"
  fileName.append(fileExtension)
  guard let newPath = directory?.appendingPathComponent(fileName) else {
    return nil
  }

  try data.write(to: newPath, options: .atomic)
  var response: [String: Any?] = [
    "uri": newPath.path,
    "width": image?.cgImage?.width,
    "height": image?.cgImage?.height
  ]

  if includeBase64 {
    let base64string = data.base64EncodedString(options: .endLineWithLineFeed)
    response["base64"] = String(format: "%@%@", "data:image/png;base64,", base64string)
  }

  return response
}

private func relationsFor(contact person: CNContact) -> [[String: Any]]? {
  var results = [[String: Any]]()

  for container in person.contactRelations {
    let val = container.value
    var relation = [String: Any]()
    relation["name"] = val.name
    relation["id"] = container.identifier
    if let label = container.label {
      relation["label"] = CNLabeledValue<NSString>.localizedString(forLabel: label)
    }
    results.append(relation)
  }

  return results.isEmpty ? nil : results
}

private func instantMessageAddressesFor(contact person: CNContact) -> [[String: Any]]? {
  var results = [[String: Any]]()

  for container in person.instantMessageAddresses {
    let val = container.value
    var address = [String: Any]()
    address["service"] = val.service
    address["localizedService"] = CNInstantMessageAddress.localizedString(forKey: val.service)
    address["username"] = val.username
    address["id"] = container.identifier
    address["label"] = container.label
    results.append(address)
  }

  return results.isEmpty ? nil : results
}

private func socialProfilesFor(contact person: CNContact) -> [[String: Any]]? {
  var results = [[String: Any]]()

  for container in person.socialProfiles {
    let val = container.value
    var profile = [String: Any]()
    profile["service"] = val.service
    profile["localizedService"] = CNInstantMessageAddress.localizedString(forKey: val.service)
    profile["url"] = val.urlString
    profile["username"] = val.username
    profile["userId"] = val.userIdentifier
    profile["id"] = container.identifier
    if let label = container.label {
      profile["label"] = CNLabeledValue<NSString>.localizedString(forLabel: label) ?? label
    }
    results.append(profile)
  }

  return results.isEmpty ? nil : results
}

private func emailsFor(contact person: CNContact) -> [[String: Any]]? {
  var results = [[String: Any]]()

  for container in person.emailAddresses {
    let emailAddress = container.value as String
    if let label = container.label {
      let emailLabel = CNLabeledValue<NSString>.localizedString(forLabel: label)
      results.append(["email": emailAddress, "label": emailLabel, "id": container.identifier])
    } else {
      results.append(["email": emailAddress, "id": container.identifier])
    }
  }

  return results.isEmpty ? nil : results
}

private func phoneNumbersFor(contact person: CNContact) -> [[String: Any]]? {
  var results = [[String: Any]]()

  for container in person.phoneNumbers {
    let val = container.value
    var phoneNumber = [String: Any]()
    phoneNumber["number"] = val.stringValue
    phoneNumber["countryCode"] = val.value(forKey: "countryCode")
    phoneNumber["digits"] = val.value(forKey: "digits")
    phoneNumber["id"] = container.identifier
    if let label = container.label {
      phoneNumber["label"] = CNLabeledValue<NSString>.localizedString(forLabel: label)
    }
    results.append(phoneNumber)
  }

  return results.isEmpty ? nil : results
}

private func addressesFor(contact person: CNContact) -> [[String: Any]]? {
  var results = [[String: Any]]()

  for container in person.postalAddresses {
    let val = container.value

    var address = [String: Any]()
    address["street"] = val.street
    address["city"] = val.city
    address["region"] = val.state
    address["postalCode"] = val.postalCode
    address["country"] = val.country
    address["isoCountryCode"] = val.isoCountryCode
    address["id"] = container.identifier

    if let label = container.label {
      address["label"] = CNLabeledValue<NSString>.localizedString(forLabel: label)
    }

    results.append(address)
  }

  return results.isEmpty ? nil : results
}

private func birthdayFor(contact birthday: DateComponents?) -> [String: Any?]? {
  guard let birthday else {
    return nil
  }

  var birthdayObject = [String: Any?]()
  if let month = birthday.month {
    birthdayObject["month"] = month - 1
  }
  if let day = birthday.day {
    birthdayObject["day"] = day
  }
  if let year = birthday.year {
    birthdayObject["year"] = year
  }
  if let calendar = birthday.calendar {
    birthdayObject["format"] = calendarFormatToString(calendar.identifier)
  }

  return birthdayObject
}

private func urlsFor(contact person: CNContact) -> [[String: Any]]? {
  var results = [[String: Any]]()

  for container in person.urlAddresses {
    let urlAddress = container.value
    if let label = container.label {
      let urlLabel = CNLabeledValue<NSString>.localizedString(forLabel: label)
      results.append(["url": urlAddress, "label": urlLabel, "id": container.identifier])
    } else {
      results.append(["url": urlAddress, "id": container.identifier])
    }
  }

  return results.isEmpty ? nil : results
}

private func datesFor(contact person: CNContact) -> [[String: Any]]? {
  var results = [[String: Any]]()

  for container in person.dates {
    let val = container.value
    var date = [String: Any]()
    date["day"] = val.day
    date["month"] = val.month - 1
    date["year"] = val.year != NSDateComponentUndefined ? val.year : nil
    date["id"] = container.identifier
    if let calendar = val.calendar {
      date["format"] = calendarFormatToString(calendar.identifier)
    }
    if let label = container.label {
      date["label"] = CNLabeledValue<NSString>.localizedString(forLabel: label)
    }
    results.append(date)
  }

  return results.isEmpty ? nil : results
}

private func fieldHasValue(field: String) -> Bool {
  return !field.isEmpty
}

private func calendarFormatToString(_ identifier: Calendar.Identifier) -> String {
  let mapping: [Calendar.Identifier: String] = [
    .gregorian: "gregorian",
    .buddhist: "buddhist",
    .chinese: "chinese",
    .coptic: "coptic",
    .ethiopicAmeteMihret: "ethiopicAmeteMihret",
    .ethiopicAmeteAlem: "ethiopicAmeteAlem",
    .hebrew: "hebrew",
    .iso8601: "iso8601",
    .indian: "indian",
    .islamic: "islamic",
    .islamicCivil: "islamicCivil",
    .japanese: "japanese",
    .persian: "persian",
    .republicOfChina: "republicOfChina",
    .islamicTabular: "islamicTabular",
    .islamicUmmAlQura: "islamicUmmAlQura"
  ]

  return mapping[identifier] ?? ""
}

func encodeContainer(_ container: CNContainer) -> [String: Any] {
  return [
    "name": container.name ?? "",
    "id": container.identifier,
    "type": encodeContainerType(container.type)
  ]
}

private func encodeContainerType(_ type: CNContainerType) -> String {
  switch type {
  case .local:
    return "local"
  case .exchange:
    return "exchange"
  case .cardDAV:
    return "cardDAV"
  @unknown default:
    return "unassigned"
  }
}

func encodeGroup(_ group: CNGroup) -> [String: Any]? {
  return [
    "id": group.identifier,
    "name": group.name
  ]
}
