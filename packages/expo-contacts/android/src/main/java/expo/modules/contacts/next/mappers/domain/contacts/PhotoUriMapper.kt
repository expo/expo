package expo.modules.contacts.next.mappers.domain.contacts

import expo.modules.contacts.next.domain.model.headers.PhotoUri

object PhotoUriMapper: ContactsPropertyMapper<PhotoUri, String?>{
  override fun toDto(model: PhotoUri) = model.value
}
