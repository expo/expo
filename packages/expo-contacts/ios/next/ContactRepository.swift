import Foundation
import Contacts
import ExpoModulesCore

class ContactRepository {
  private let store: CNContactStore
  
  init(store: CNContactStore) {
    self.store = store
  }
  
  func delete(id: String) throws {
    let mutableContact = try getMutableById(id: id, keysToFetch: [])
    let saveRequest = CNSaveRequest()
    saveRequest.delete(mutableContact)
    try store.execute(saveRequest)
  }
  
  func insert(contact: CNMutableContact) throws {
    let saveRequest = CNSaveRequest()
    saveRequest.add(contact, toContainerWithIdentifier: nil)
    try store.execute(saveRequest)
  }
  
  func update(contact: CNMutableContact) throws {
    let saveRequest = CNSaveRequest()
    saveRequest.update(contact)
    try store.execute(saveRequest)
  }

  func getById(id: String, keysToFetch: [CNKeyDescriptor]) -> CNContact? {
    return try? store.unifiedContact(withIdentifier: id, keysToFetch: keysToFetch)
  }
  
  func getMutableById(id: String, keysToFetch: [CNKeyDescriptor]) throws -> CNMutableContact {
    let contact = getById(id: id, keysToFetch: keysToFetch)
    guard let mutableContact = contact?.mutableCopy() as? CNMutableContact else {
      throw FailedToGetMutableContact()
    }
    return mutableContact
  }
  
  func getPaginated(
    keysToFetch: [CNKeyDescriptor],
    predicate: NSPredicate?,
    limit: Int?,
    offset: Int?,
    filter: ((CNContact) -> Bool) = { (contact: CNContact) in return true },
    sortOrder: CNContactSortOrder? = CNContactSortOrder.userDefault,
    unifyResults: Bool? = false
  ) throws -> [CNContact] {
    let request = CNContactFetchRequest(keysToFetch: keysToFetch)
    request.unifyResults = unifyResults ?? false
    request.predicate = predicate
    request.sortOrder = sortOrder ?? CNContactSortOrder.userDefault

    var contacts: [CNContact] = []
    var currentIndex = 0
    try store.enumerateContacts(with: request) { (contact, stop) in
      if !filter(contact) {
        return
      }
      if let offset = offset, currentIndex < offset {
        currentIndex += 1
        return
      }
      contacts.append(contact)
      currentIndex += 1
      if let limit = limit, contacts.count >= limit {
        stop.pointee = true
      }
    }
    
    return contacts
  }
  
  func getAll(keysToFetch: [CNKeyDescriptor]) throws -> [CNContact] {
    let request = CNContactFetchRequest(keysToFetch: keysToFetch)
    var contacts: [CNContact] = []
    
    try store.enumerateContacts(with: request) { (contact, stop) in
      contacts.append(contact)
    }
    
    return contacts
  }
  
  func getCount() throws -> Int {
    let request = CNContactFetchRequest(keysToFetch: [])
    var count = 0
    try store.enumerateContacts(with: request) { (_, _) in
        count += 1
    }
    return count
  }
  
  func hasAny() throws -> Bool {
    let request = CNContactFetchRequest(keysToFetch: [])
    var result = false
    try store.enumerateContacts(with: request) { (_, stop) in
        result = true
        stop.pointee = true
    }
    return result
  }
}
