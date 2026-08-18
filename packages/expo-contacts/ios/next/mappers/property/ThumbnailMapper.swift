import Contacts

struct ThumbnailMapper: PropertyMapper {
  typealias TDto = String?
  internal var descriptor: CNKeyDescriptor { CNContactThumbnailImageDataKey as CNKeyDescriptor }
  private let service: ImageService
  private let filename: String

  init(service: ImageService, filename: String) {
    self.service = service
    self.filename = filename
  }

  func extract(from contact: CNContact) throws -> String? {
    guard let data = contact.thumbnailImageData else {
      return nil
    }
    return try service.url(from: data, filename: filename)
  }

  func apply(_ value: String?, to contact: CNMutableContact) throws {
    throw FailedToSetReadOnlyProperty()
  }
}
