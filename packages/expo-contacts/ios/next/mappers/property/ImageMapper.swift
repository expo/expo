struct ImageMapper: PropertyMapper {
  typealias TDomain = Data?
  typealias TDto = String?
  
  private let service: ImageService
  private let filename: String

  init(service: ImageService, filename: String) {
    self.service = service
    self.filename = filename
  }

  func toDto(value: Data?) throws -> String? {
    guard let data = value else {
      return nil
    }
    return try service.url(from: data, filename: filename)
  }

  func toDomain(value: String?) throws -> Data? {
    guard let path = value else {
      return nil
    }
    return try service.imageData(from: path)
  }
}
