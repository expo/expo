import Contacts

protocol PropertyMapper {
  associatedtype TDto
  var descriptor: CNKeyDescriptor { get }
  func extract(from contact: CNContact) throws -> TDto
  func apply(_ value: TDto, to contact: CNMutableContact) throws
}
