import Contacts
import ExpoModulesCore

class ContainerRepository {
  private let store: CNContactStore

  init(store: CNContactStore) {
    self.store = store
  }

  func getAll() throws -> [CNContainer] {
    return try store.containers(matching: nil)
  }

  func getById(id: String) throws -> CNContainer? {
    let predicate = CNContainer.predicateForContainers(withIdentifiers: [id])
    let containers = try store.containers(matching: predicate)
    return containers.first
  }

  func getDefault() throws -> CNContainer? {
    let defaultId = store.defaultContainerIdentifier()
    return try getById(id: defaultId)
  }
}
