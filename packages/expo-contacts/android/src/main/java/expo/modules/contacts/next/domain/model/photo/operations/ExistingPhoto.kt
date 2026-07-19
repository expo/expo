package expo.modules.contacts.next.domain.model.photo.operations

import expo.modules.contacts.next.domain.model.Extractable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.photo.PhotoModel
import expo.modules.contacts.next.domain.wrappers.DataId

class ExistingPhoto(
  override val dataId: DataId,
  photo: ByteArray?
) : PhotoModel(photo), Extractable.Data, Updatable.Data
