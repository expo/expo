package expo.modules.contacts.next.mappers.domain.contacts

import expo.modules.contacts.next.domain.model.headers.PhotoThumbnailUri

object PhotoThumbnailUriMapper : ContactsPropertyMapper<PhotoThumbnailUri, String?> {
  override fun toDto(model: PhotoThumbnailUri) = model.value
}
