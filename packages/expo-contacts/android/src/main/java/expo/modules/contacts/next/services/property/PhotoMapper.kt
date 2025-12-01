package expo.modules.contacts.next.services.property

import androidx.core.net.toUri
import expo.modules.contacts.next.domain.model.Appendable
import expo.modules.contacts.next.domain.model.Updatable
import expo.modules.contacts.next.domain.model.headers.PhotoThumbnailUri
import expo.modules.contacts.next.domain.model.headers.PhotoUri
import expo.modules.contacts.next.domain.model.photo.operations.AppendablePhoto
import expo.modules.contacts.next.domain.model.photo.operations.PatchPhoto
import expo.modules.contacts.next.domain.wrappers.DataId
import expo.modules.contacts.next.domain.wrappers.RawContactId
import expo.modules.contacts.next.services.ImageByteArrayConverter
import expo.modules.kotlin.types.ValueOrUndefined

sealed class PhotoMapper {

  class PhotoUriProperty(val imageByteArrayConverter: ImageByteArrayConverter): PropertyMapper<PhotoUri, String?> {
    override fun toDto(model: PhotoUri) = model.value
    override fun toUpdatable(dataId: DataId, newValue: String?): Updatable.Data {
      val byteArray = newValue?.let {
        imageByteArrayConverter.toByteArray(it.toUri())
      }
      return PatchPhoto(dataId, photo = ValueOrUndefined.Value(byteArray))
    }

    override fun toAppendable(newValue: String?, rawContactId: RawContactId): Appendable {
      val byteArray = newValue?.let {
        imageByteArrayConverter.toByteArray(newValue.toUri())
      }
      return AppendablePhoto(rawContactId = rawContactId, photo = byteArray)
    }
  }

  object ThumbnailUri : ReadPropertyMapper<PhotoThumbnailUri, String> {
    override fun toDto(model: PhotoThumbnailUri): String? {
      return model.value
    }
  }
}
