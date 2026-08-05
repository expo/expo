package expo.modules.contacts.next.domain.model.photo.operations

import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.photo.PhotoModel
import expo.modules.contacts.next.domain.wrappers.RawContactId

class AppendablePhoto(
  override val rawContactId: RawContactId,
  photo: ByteArray?
) : PhotoModel(photo), Appendable
