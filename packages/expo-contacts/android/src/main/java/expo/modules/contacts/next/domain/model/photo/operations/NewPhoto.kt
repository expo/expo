package expo.modules.contacts.next.domain.model.photo.operations

import expo.modules.contacts.next.domain.model.Insertable
import expo.modules.contacts.next.domain.model.photo.PhotoModel

class NewPhoto(
  photo: ByteArray?
): PhotoModel(photo), Insertable
