import ExpoModulesCore
import Contacts

class ContactFactory {
  private let contactRepository: ContactRepository
  private let imageService: ImageService

  init(contactRepository: ContactRepository, imageService: ImageService) {
    self.contactRepository = contactRepository
    self.imageService = imageService
  }

  func create(id: String) -> ContactNext {
    return ContactNext(
      id: id,
      contactRepository: contactRepository,
      imageService: imageService
    )
  }
}
