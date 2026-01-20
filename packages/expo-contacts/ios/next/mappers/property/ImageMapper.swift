import Contacts

struct ImageMapper: PropertyMapper {
  typealias TDto = String?
  internal var descriptor: CNKeyDescriptor { CNContactImageDataKey as CNKeyDescriptor }
  private let service: ImageService
  private let filename: String

  init(service: ImageService, filename: String) {
    self.service = service
    self.filename = filename
  }

  func extract(from contact: CNContact) throws -> String? {
    guard let data = contact.imageData else {
      return nil
    }
    return try service.url(from: data, filename: filename)
  }

  func apply(_ value: String?, to contact: CNMutableContact) throws {
    guard let path = value else {
      contact.imageData = nil
      return
    }
    let data = try service.imageData(from: path)
    contact.imageData = data
  }
}
