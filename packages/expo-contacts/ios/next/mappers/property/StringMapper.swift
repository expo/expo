import Contacts

struct StringMapper: PropertyMapper {
  typealias TDto = String?
  internal let descriptor: CNKeyDescriptor
  private let keyPath: ReferenceWritableKeyPath<CNMutableContact, String>
  private let keyString: String

  init(descriptor: String, keyPath: ReferenceWritableKeyPath<CNMutableContact, String>) {
    self.descriptor = descriptor as CNKeyDescriptor
    self.keyPath = keyPath
    self.keyString = descriptor
  }

  func extract(from contact: CNContact) throws -> String? {
    // Reading or writing a key that was not fetched raises an Objective-C exception, which Swift cannot catch.
    guard contact.isKeyAvailable(keyString) else {
      return nil
    }
    let value = contact.value(forKey: keyString) as? String
    return (value?.isEmpty ?? true) ? nil : value
  }

  func apply(_ value: String?, to contact: CNMutableContact) throws {
    guard contact.isKeyAvailable(keyString) else {
      throw ContactFieldNotAccessibleException(keyString)
    }
    contact[keyPath: keyPath] = value ?? ""
  }
}
