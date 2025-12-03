package expo.modules.contacts.next.mappers.domain.data

import androidx.core.net.toUri
import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.photo.operations.AppendablePhoto
import expo.modules.contacts.next.domain.model.photo.operations.ExistingPhoto
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.services.ImageByteArrayConverter

class PhotoPropertyMapper(val imageByteArrayConverter: ImageByteArrayConverter) : MutableDataPropertyMapper<ExistingPhoto, String?> {
  override fun toDto(model: ExistingPhoto) = model.photo?.toString(Charsets.UTF_8)

  override fun toUpdatable(dataId: DataId, newValue: String?): Updatable.Data {
    val byteArray = newValue?.let {
      imageByteArrayConverter.toByteArray(it.toUri())
    }
    return ExistingPhoto(dataId, byteArray)
  }

  override fun toAppendable(newValue: String?, rawContactId: RawContactId): Appendable {
    val byteArray = newValue?.let {
      imageByteArrayConverter.toByteArray(it.toUri())
    }
    return AppendablePhoto(rawContactId, byteArray)
  }
}
