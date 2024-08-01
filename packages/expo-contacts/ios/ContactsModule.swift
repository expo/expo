import ExpoModulesCore
import Contacts
import ContactsUI

public class ContactsModule: Module, OnContactPickingResultHandler {
  private let contactStore = CNContactStore()
  private let delegate = ContactControllerDelegate()
  private var presentingViewController: UIViewController?
  private var contactPickerDelegate: ContactPickerControllerDelegate?
  private var contactPickingPromise: Promise?
  private var contactManipulationPromise: Promise?

  public func definition() -> ModuleDefinition {
    Name("ExpoContacts")

    OnCreate {
      appContext?.permissions?.register([
        ContactsPermissionRequester()
      ])
    }

    AsyncFunction("getDefaultContainerIdentifierAsync") {
      return contactStore.defaultContainerIdentifier()
    }

    AsyncFunction("writeContactToFileAsync") { (options: ContactsQuery) -> String? in
      let keys = contactKeysToFetch(from: options.fields)
      let payload = fetchContactsData(options: options, keys: keys, isWriting: true)

      if payload["error"] != nil {
        throw FailedToFetchContactsException()
      }

      guard let contacts = payload["data"] as? [CNContact] else {
        throw FailedToFetchContactsException()
      }

      var fileName = UUID().uuidString

      if contacts.count == 1 {
        let name = CNContactFormatter.string(from: contacts[0], style: .fullName)
        if let name {
          fileName = name.components(separatedBy: " ").joined(separator: "_")
        }
      }

      let fileExtension = "vcf"
      let directory = appContext?.config.cacheDirectory?.appendingPathComponent("Contacts")
      FileSystemUtilities.ensureDirExists(at: directory)

      fileName = fileName.appending(".\(fileExtension)")
      let newPath = directory?.appendingPathComponent(fileName)

      do {
        let data = try CNContactVCardSerialization.data(with: contacts)
        if let newPath {
          try data.write(to: newPath, options: .atomic)
        }
        return newPath?.absoluteString
      } catch {
        throw FailedToCacheContacts()
      }
    }

    AsyncFunction("dismissFormAsync") { (promise: Promise) in
      guard let presentingViewController else {
        promise.resolve(false)
        return
      }
      presentingViewController.dismiss(animated: true) {
        self.presentingViewController = nil
        promise.resolve(true)
      }
    }.runOnQueue(.main)

    // swiftlint:disable closure_body_length
    AsyncFunction("presentFormAsync") { (identifier: String?, data: Contact?, options: FormOptions, promise: Promise) in
      // swiftlint:enable closure_body_length
      if contactManipulationPromise != nil {
        throw ContactManipulationInProgressException()
      }

      var controller: ContactsViewController?

      if let identifier {
        if let foundContact = try? getContact(withId: identifier) {
          controller = ContactsViewController.init(forNewContact: foundContact)
        }
      } else {
        var contact = CNMutableContact()
        if let data {
          try mutateContact(&contact, with: data)
          if options.isNew == true {
            controller = ContactsViewController.init(forNewContact: contact)
          } else {
            controller = ContactsViewController.init(forUnknownContact: contact)
          }
        }
      }

      guard let controller else {
        promise.reject(FailedToCreateViewControllerException())
        return
      }

      let cancelButtonTitle = options.cancelButtonTitle ?? "Cancel"
      controller.setCloseButton(title: cancelButtonTitle)
      controller.contactStore = contactStore
      controller.delegate = delegate

      if let displayedPropertyKeys = options.displayedPropertyKeys {
        let keys = contactKeysToFetch(from: displayedPropertyKeys)
        controller.displayedPropertyKeys = getDescriptors(for: keys)
      }
      if let allowsEditing = options.allowsEditing {
        controller.allowsEditing = allowsEditing
      }
      if let allowsActions = options.allowsActions {
        controller.allowsActions = allowsActions
      }
      if let shouldShowLinkedContacts = options.shouldShowLinkedContacts {
        controller.shouldShowLinkedContacts = shouldShowLinkedContacts
      }
      if let message = options.message {
        controller.message = message
      }
      if let alternateName = options.alternateName {
        controller.alternateName = alternateName
      }
      if let groupId = options.groupId {
        controller.parentGroup = try group(with: groupId)
      }

      let parent = appContext?.utilities?.currentViewController()
      let navController = UINavigationController(rootViewController: controller)
      presentingViewController = navController
      let animated = options.preventAnimation == true ? false : true

      controller.onViewDisappeared = {
        promise.resolve()
        self.contactManipulationPromise = nil
      }

      contactManipulationPromise = promise
      parent?.present(navController, animated: animated)
    }.runOnQueue(.main)

    AsyncFunction("presentContactPickerAsync") { (promise: Promise) in
      if contactPickingPromise != nil {
        throw ContactPickingInProgressException()
      }

      let pickerController = CNContactPickerViewController()

      contactPickerDelegate = ContactPickerControllerDelegate(onContactPickingResultHandler: self)

      pickerController.delegate = self.contactPickerDelegate

      let currentController = appContext?.utilities?.currentViewController()

      contactPickingPromise = promise

      currentController?.present(pickerController, animated: true)
    }.runOnQueue(.main)

    AsyncFunction("addExistingContactToGroupAsync") { (identifier: String, groupId: String) in
      let saveRequest = CNSaveRequest()
      let keysToFetch = contactKeysToFetch(from: nil)

      if let contact = try getContact(with: identifier, keysToFetch: keysToFetch) {
        let group = try group(with: groupId)
        saveRequest.addMember(contact, to: group)
        try executeSaveRequest(saveRequest)
      }
    }

    AsyncFunction("addContactAsync") { (contact: Contact, containerId: String?) -> String in
      let saveRequest = CNSaveRequest()
      var person = CNMutableContact()
      let id = containerId != nil ? containerId : contactStore.defaultContainerIdentifier()

      try mutateContact(&person, with: contact)
      saveRequest.add(person, toContainerWithIdentifier: id)
      try executeSaveRequest(saveRequest)
      return person.identifier
    }

    AsyncFunction("updateContactAsync") { (contact: Contact) -> String in
      let keysToFetch = contactKeysToFetch(from: nil)
      let saveRequest = CNSaveRequest()
      guard var person = try getContact(with: contact.id, keysToFetch: keysToFetch) else {
        throw FailedToFindContactException()
      }
      try mutateContact(&person, with: contact)
      saveRequest.update(person)
      try executeSaveRequest(saveRequest)
      return person.identifier
    }

    AsyncFunction("removeContactAsync") { (identifier: String) in
      let saveRequest = CNSaveRequest()
      let keysToFetch = [CNContactIdentifierKey]
      guard let contact = try getContact(with: identifier, keysToFetch: keysToFetch) else {
        return
      }
      saveRequest.delete(contact)
      try executeSaveRequest(saveRequest)
    }

    AsyncFunction("updateGroupNameAsync") { (groupName: String, groupId: String) in
      let saveRequest = CNSaveRequest()
      let group = try group(with: groupId)
      guard let mutatbleGroup = group as? CNMutableGroup else {
        return
      }
      mutatbleGroup.name = groupName
      saveRequest.update(mutatbleGroup)
      try executeSaveRequest(saveRequest)
    }

    AsyncFunction("addExistingGroupToContainerAsync") { (groupId: String, containerId: String) -> [String: Any]? in
      let saveRequest = CNSaveRequest()
      guard let group = try group(with: groupId) as? CNMutableGroup else {
        return nil
      }
      saveRequest.add(group, toContainerWithIdentifier: containerId)
      try executeSaveRequest(saveRequest)
      return encodeGroup(group)
    }

    AsyncFunction("createGroupAsync") { (name: String, containerId: String) -> String in
      let saveRequest = CNSaveRequest()
      let group = CNMutableGroup()
      group.name = name
      saveRequest.add(group, toContainerWithIdentifier: containerId)
      try executeSaveRequest(saveRequest)
      return group.identifier
    }

    AsyncFunction("removeContactFromGroupAsync") { (identifier: String, groupId: String) in
      let saveRequest = CNSaveRequest()
      let ketsToFetch = [CNContactIdentifierKey]

      guard let contact = try getContact(with: identifier, keysToFetch: ketsToFetch) else {
        return
      }
      guard let group = try group(with: groupId) as? CNMutableGroup else {
        return
      }
      saveRequest.removeMember(contact, from: group)
      try executeSaveRequest(saveRequest)
    }

    AsyncFunction("removeGroupAsync") { (groupId: String) in
      let saveRequest = CNSaveRequest()
      guard let group = try group(with: groupId) as? CNMutableGroup else {
        return
      }

      saveRequest.delete(group)
      try executeSaveRequest(saveRequest)
    }

    AsyncFunction("getContainersAsync") { (options: ContainerQuery) -> [[String: Any]] in
      var predicate = NSPredicate()
      if let id = options.contactId {
        predicate = CNContainer.predicateForContainerOfContact(withIdentifier: id)
      } else if let groupId = options.groupId {
        predicate = CNContainer.predicateForContainerOfGroup(withIdentifier: groupId)
      } else if let containerId = options.containerId {
        predicate = CNContainer.predicateForContainers(withIdentifiers: containerId)
      }

      do {
        let containers = try contactStore.containers(matching: predicate)
        var response = [[String: Any]]()
        for container in containers {
          response.append(encodeContainer(container))
        }
        return response
      } catch {
        throw FetchContainersException()
      }
    }

    AsyncFunction("getGroupsAsync") { (options: GroupQuery) -> [[String: Any]?]? in
      var response = [[String: Any]?]()

      if let name = options.groupName {
        if let groups = try groupsWithName(name: name) {
          response.append(contentsOf: groups)
        }
      } else {
        guard let groups = try getGroupsWithData(options) else {
          return nil
        }
        for group in groups {
          response.append(encodeGroup(group))
        }
      }

      return response
    }

    AsyncFunction("getContactsAsync") { (options: ContactsQuery) -> [String: Any]? in
      let keysToFetch = contactKeysToFetch(from: options.fields)
      let payload = fetchContactsData(options: options, keys: keysToFetch)

      return try serializeContactPayload(payload: payload, keys: keysToFetch, options: options)
    }

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.getPermissionUsingRequesterClass(
        ContactsPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.askForPermission(
        usingRequesterClass: ContactsPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }
  }

  func didPickContact(contact: CNContact) throws {
    defer {
      contactPickingPromise = nil
    }

    let serializedContact = try serializeContact(person: contact, keys: nil, directory: nil)
    contactPickingPromise?.resolve(serializedContact)
  }

  func didCancelPickingContact() {
    contactPickingPromise?.resolve()
    contactPickingPromise = nil
  }

  private func getContact(withId identifier: String) throws -> CNContact {
    do {
      let keysToFetch = [CNContactViewController.descriptorForRequiredKeys()]
      return try contactStore.unifiedContact(withIdentifier: identifier, keysToFetch: keysToFetch)
    } catch {
      throw FailedToUnifyContactException()
    }
  }

  private func groupsWithName(name: String) throws -> [[String: Any]]? {
    do {
      let groups = try contactStore.groups(matching: nil)
      var response: [[String: Any]] = []

      for group in groups where group.name == name {
        if let encodedGroup = encodeGroup(group) {
          response.append(encodedGroup)
        }
      }
      return response
    } catch {
      throw FetchGroupException(name)
    }
  }

  func getGroupsWithData(_ data: GroupQuery) throws -> [CNGroup]? {
    var predicate: NSPredicate?
    if let containerId = data.containerId {
      CNGroup.predicateForGroupsInContainer(withIdentifier: containerId)
      predicate = CNGroup.predicateForGroupsInContainer(withIdentifier: containerId)
    } else if let groupIds = data.groupId {
      predicate = CNGroup.predicateForGroups(withIdentifiers: [groupIds])
    }

    do {
      return try contactStore.groups(matching: predicate)
    } catch {
      throw GroupQueryException()
    }
  }

  private func serializeContactPayload(payload: [String: Any], keys: [String], options: ContactsQuery) throws -> [String: Any]? {
    if payload["error"] != nil {
      return nil
    }
    var mutablePayload = payload
    var response = [[String: Any]]()
    guard let contacts = payload["data"] as? [CNContact] else {
      return nil
    }

    let directory = appContext?.config.cacheDirectory?.appendingPathComponent("Contacts")
    FileSystemUtilities.ensureDirExists(at: directory)

    for contact in contacts {
      response.append(try serializeContact(person: contact, keys: keys, directory: directory))
    }
    mutablePayload["data"] = response
    return mutablePayload
  }

  private func executeSaveRequest(_ saveRequest: CNSaveRequest) throws {
    do {
      try contactStore.execute(saveRequest)
    } catch {
      throw FailedToSaveException()
    }
  }

  private func group(with identifier: String) throws -> CNGroup {
    let predicate = CNGroup.predicateForGroups(withIdentifiers: [identifier])

    do {
      let groups = try contactStore.groups(matching: predicate)
      if groups.isEmpty {
        throw FailedToGetGroupException(identifier)
      }
      return groups[0]
    } catch {
      throw FailedToGetGroupException(identifier)
    }
  }

  private func mutateContact(_ contact: inout CNMutableContact, with data: Contact) throws {
    if let firstName = data.firstName {
      contact.givenName = firstName
    }
    if let lastName = data.lastName {
      contact.familyName = lastName
    }
    if let middleName = data.middleName {
      contact.middleName = middleName
    }
    if let maidenName = data.maidenName {
      contact.previousFamilyName = maidenName
    }
    if let nickname = data.nickname {
      contact.nickname = nickname
    }
    if let company = data.company {
      contact.organizationName = company
    }
    if let jobTitle = data.jobTitle {
      contact.jobTitle = jobTitle
    }
    if let department = data.department {
      contact.departmentName = department
    }
    if let namePrefix = data.namePrefix {
      contact.namePrefix = namePrefix
    }
    if let nameSuffix = data.nameSuffix {
      contact.nameSuffix = nameSuffix
    }
    if let phoneticFirstName = data.phoneticFirstName {
      contact.phoneticGivenName = phoneticFirstName
    }
    if let phoneticMiddleName = data.phoneticMiddleName {
      contact.phoneticMiddleName = phoneticMiddleName
    }
    if let phoneticLastName = data.phoneticLastName {
      contact.phoneticFamilyName = phoneticLastName
    }
    if let note = data.note {
      contact.note = note
    }

    contact.birthday = decodeBirthday(data.birthday, contact: contact)

    if let nonGregorianBirthday = data.nonGregorianBirthday {
      let identifier = nonGregorianBirthday.format
      if identifier == "hebrew" || identifier == "islamic" || identifier == "chinese" {
        contact.nonGregorianBirthday = decodeBirthday(nonGregorianBirthday, contact: contact)
      }
    }

    contact.contactType = data.contactType == ContactsKey.contactTypePerson ? .person : .organization

    if let postalAddresses = decodeAddresses(data.addresses) {
      contact.postalAddresses = postalAddresses
    }

    if let phoneNumbers = decodePhoneNumbers(data.phoneNumbers) {
      contact.phoneNumbers = phoneNumbers
    }

    if let emails = decodeEmailAddresses(data.emails) {
      contact.emailAddresses = emails
    }

    if let socialProfiles = decodeSocialProfiles(data.socialProfiles) {
      contact.socialProfiles = socialProfiles
    }

    if let instantMessageAddresses = decodeInstantMessageAddresses( data.instantMessageAddresses) {
      contact.instantMessageAddresses = instantMessageAddresses
    }

    if let urlAddresses = decodeUrlAddresses(data.urlAddresses) {
      contact.urlAddresses = urlAddresses
    }

    if let dates = decodeDates(data.dates) {
      contact.dates = dates
    }

    if let relationships = decodeRelationships(data.relationships) {
      contact.contactRelations = relationships
    }

    if let keyImage = data.image {
      let imageData = try imageData(forPath: keyImage.uri)
      if let imageData {
        contact.imageData = imageData
      }
    }
  }

  private func imageData(forPath uri: String?) throws -> Data? {
    guard let uri, let url = URL(string: uri) else {
      throw FilePermissionException(uri)
    }

    let path = url.path
    let standardizedPath = NSString(string: path).standardizingPath

    guard FileSystemUtilities.permissions(appContext, for: url).contains(.read) else {
      return nil
    }

    guard let image = UIImage(contentsOfFile: standardizedPath) else {
      throw FailedToOpenImageException()
    }

    return image.pngData()
  }

  private func getContact(with identifier: String?, keysToFetch: [String]) throws -> CNMutableContact? {
    guard let identifier else {
      return nil
    }
    do {
      return try contactStore.unifiedContact(withIdentifier: identifier, keysToFetch: getDescriptors(for: keysToFetch)).mutableCopy() as? CNMutableContact
    } catch {
      throw FailedToGetContactException(identifier)
    }
  }

  private func fetchContactsData(options: ContactsQuery, keys: [String], isWriting: Bool = false) -> [String: Any] {
    var predicate: NSPredicate?

    if let id = options.id {
      predicate = CNContact.predicateForContacts(withIdentifiers: id)
    } else if let name = options.name {
      predicate = CNContact.predicateForContacts(matchingName: name)
    } else if let groupId = options.groupId {
      predicate = CNContact.predicateForContactsInGroup(withIdentifier: groupId)
    } else if let containerId = options.containerId {
      predicate = CNContact.predicateForContacts(withIdentifiers: [containerId])
    }

    let descriptors = getDescriptors(for: keys, isWriting: isWriting)
    return queryContacts(with: predicate, keys: descriptors, options: options)
  }

  private func queryContacts(with predicate: NSPredicate?, keys: [CNKeyDescriptor], options: ContactsQuery) -> [String: Any] {
    let pageOffset = options.pageOffset ?? 0
    let pageSize = options.pageSize ?? 0

    let fetchRequest = buildFetchRequest(sort: options.sort, keys: keys)
    fetchRequest.predicate = predicate

    fetchRequest.unifyResults = true
    if let rawContacts = options.rawContacts {
      fetchRequest.unifyResults = !rawContacts
    }

    var currentIndex = 0
    var response = [CNContact]()
    let endIndex = pageOffset + pageSize

    do {
      try contactStore.enumerateContacts(with: fetchRequest) { contact, _ in
        let shouldAddContact = (currentIndex >= pageOffset) && (currentIndex < endIndex)
        currentIndex += 1
        if shouldAddContact || pageSize <= 0 {
          response.append(contact)
        }
      }
    } catch {
      return ["error": error.localizedDescription]
    }

    let total = currentIndex
    var hasNextPage = false
    let hasPreviousPage = pageOffset > 0
    if pageSize > 0 {
      hasNextPage = pageOffset + pageSize < total
    }

    return [
      ContactsKey.data: response,
      ContactsKey.hasNextPage: hasNextPage,
      ContactsKey.hasPreviousPage: hasPreviousPage,
      ContactsKey.total: total
    ]
  }

  private func buildFetchRequest(sort: String?, keys: [CNKeyDescriptor]) -> CNContactFetchRequest {
    let fetchRequest = CNContactFetchRequest(keysToFetch: keys)

    let sortOrders = [
      "userDefault": CNContactSortOrder.userDefault,
      "firstName": CNContactSortOrder.givenName,
      "lastName": CNContactSortOrder.familyName,
      "none": CNContactSortOrder.none
    ]

    if let sort, let sortOrder = sortOrders[sort] {
      fetchRequest.sortOrder = sortOrder
    }

    return fetchRequest
  }
}
