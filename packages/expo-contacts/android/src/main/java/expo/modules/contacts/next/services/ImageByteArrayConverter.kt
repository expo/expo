package expo.modules.contacts.next.services

import android.content.ContentResolver
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import java.io.ByteArrayOutputStream

class ImageByteArrayConverter(private val contentResolver: ContentResolver) {
  fun toByteArray(uri: Uri): ByteArray {
    val bitmap = contentResolver.openInputStream(uri).use { inputStream ->
      return@use BitmapFactory.decodeStream(inputStream)
    }
    val stream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)
    return stream.toByteArray()
  }
}