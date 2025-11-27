import Contacts
import ExpoModulesCore

class GroupRepository {
  private let store: CNContactStore
  
  init(store: CNContactStore) {
    self.store = store
  }
  
  func getById(groupId: String) throws -> CNGroup? {
    let predicate = CNGroup.predicateForGroups(withIdentifiers: [groupId])
    let groups = try store.groups(matching: predicate)
    return groups.first
  }
  
  func getAll(containerId: String? = nil) throws -> [CNGroup] {
    let predicate: NSPredicate?
    if let containerId = containerId {
      predicate = CNGroup.predicateForGroupsInContainer(withIdentifier: containerId)
    } else {
      predicate = nil
    }
    return try store.groups(matching: predicate)
  }
  
  func getMutableById(id: String) throws -> CNMutableGroup {
    guard let group = try getById(groupId: id),
          let mutableGroup = group.mutableCopy() as? CNMutableGroup else {
      throw GroupNotFoundException(id)
    }
    return mutableGroup
  }

  func insert(group: CNMutableGroup, containerId: String?) throws {
    let saveRequest = CNSaveRequest()
    saveRequest.add(group, toContainerWithIdentifier: containerId)
    try store.execute(saveRequest)
  }
  
  func update(group: CNMutableGroup) throws {
    let saveRequest = CNSaveRequest()
    saveRequest.update(group)
    try store.execute(saveRequest)
  }
  
  func delete(id: String) throws {
    let mutableGroup = try getMutableById(id: id)
    let saveRequest = CNSaveRequest()
    saveRequest.delete(mutableGroup)
    try store.execute(saveRequest)
  }
  
  func addMember(contact: CNContact, to group: CNGroup) throws {
    let saveRequest = CNSaveRequest()
    saveRequest.addMember(contact, to: group)
    try store.execute(saveRequest)
  }
  
  func removeMember(contact: CNContact, from group: CNGroup) throws {
    let saveRequest = CNSaveRequest()
    saveRequest.removeMember(contact, from: group)
    try store.execute(saveRequest)
  }
}
