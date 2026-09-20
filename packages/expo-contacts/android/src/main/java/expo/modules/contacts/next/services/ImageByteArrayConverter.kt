package expo.modules.contacts.next.services

import android.content.ContentResolver
import android.graphics.Bitmap
import android.net.Uri
import expo.modules.contacts.ContactPhotoDecoder
import java.io.ByteArrayOutputStream

class ImageByteArrayConverter(private val contentResolver: ContentResolver) {
  fun toByteArray(uri: Uri): ByteArray {
    val bitmap = ContactPhotoDecoder.decodeDownsampled(contentResolver, uri)
    val stream = ByteArrayOutputStream()
    bitmap!!.compress(Bitmap.CompressFormat.JPEG, 80, stream)
    return stream.toByteArray()
  }
}