import ExpoModulesCore
import Contacts

class Container: SharedObject {
  let id: String
  private let containerRepository: ContainerRepository
  private let contactRepository: ContactRepository
  private let groupRepository: GroupRepository
  private let contactFactory: ContactFactory

  init(
    id: String,
    containerRepository: ContainerRepository,
    contactRepository: ContactRepository,
    groupRepository: GroupRepository,
    contactFactory: ContactFactory
  ) {
    self.id = id
    self.containerRepository = containerRepository
    self.contactRepository = contactRepository
    self.groupRepository = groupRepository
    self.contactFactory = contactFactory
  }

  func name() throws -> String? {
    let container = try containerRepository.getById(id: id)
    return container?.name
  }

  func type() throws -> String? {
    let container = try containerRepository.getById(id: id)
    switch container?.type {
    case .local: return "local"
    case .exchange: return "exchange"
    case .cardDAV: return "cardDAV"
    case .unassigned: return "unassigned"
    default: return "unknown"
    }
  }

  func getGroups() throws -> [Group] {
    let groups = try groupRepository.getAll(containerId: id)
    return groups.map {
      Group(
        id: $0.identifier,
        groupRepository: groupRepository,
        contactRepository: contactRepository,
        contactFactory: contactFactory
      )
    }
  }
  
  func getContacts(_ queryOptions: ContactQueryOptions?) throws -> [ContactNext] {
    var keys = [CNContactIdentifierKey as CNKeyDescriptor]
    
    if queryOptions?.name != nil {
      keys.append(CNContactFormatter.descriptorForRequiredKeys(for: .fullName))
      keys.append(CNContactFormatter.descriptorForRequiredKeys(for: .phoneticFullName))
    }
    
    return try contactRepository.getPaginated(
      keysToFetch: keys,
      predicate: CNContact.predicateForContactsInContainer(withIdentifier: id),
      limit: queryOptions?.limit,
      offset: queryOptions?.offset,
      filter: { isMatchingName(contact: $0, name: queryOptions?.name) },
      sortOrder: queryOptions?.sortOrder.map {
        CNContactSortOrderMapper.map($0)
      },
      unifyResults: queryOptions?.unifyContacts ?? false
    )
    .map { contactFactory.create(id: $0.identifier) }
  }
  
  // The Contacts library does not support compound predicates.
  // Therefore we need to define our own logic to filter contacts after the fetch.
  private func isMatchingName(contact: CNContact, name: String?) -> Bool {
    guard let name = name else {
        return true
    }
    
    let fullName = CNContactFormatter.string(from: contact, style: .fullName) ?? ""
    let phoneticFullName = CNContactFormatter.string(from: contact, style: .phoneticFullName) ?? ""
    return fullName.localizedCaseInsensitiveContains(name) ||
      phoneticFullName.localizedCaseInsensitiveContains(name)
  }
  
  static func getAll(
    containerRepository: ContainerRepository,
    contactRepository: ContactRepository,
    groupRepository: GroupRepository,
    contactFactory: ContactFactory
  ) throws -> [Container] {
    let containers = try containerRepository.getAll()
    return containers.map {
      Container(
        id: $0.identifier,
        containerRepository: containerRepository,
        contactRepository: contactRepository,
        groupRepository: groupRepository,
        contactFactory: contactFactory
      )
    }
  }

  static func getDefault(
    containerRepository: ContainerRepository,
    contactRepository: ContactRepository,
    groupRepository: GroupRepository,
    contactFactory: ContactFactory
  ) throws -> Container? {
    guard let container = try containerRepository.getDefault() else {
      return nil
    }
    return Container(
      id: container.identifier,
      containerRepository: containerRepository,
      contactRepository: contactRepository,
      groupRepository: groupRepository,
      contactFactory: contactFactory
    )
  }
}
