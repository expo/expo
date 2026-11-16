package expo.modules.contacts

import android.content.ContentResolver
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.provider.ContactsContract

/**
 * Decodes contact photos downsampled to the Contacts Provider's own display-photo limit.
 *
 * Photos decoded here are written straight back to the provider, which scales them to
 * [ContactsContract.DisplayPhoto.DISPLAY_MAX_DIM] on insert, so a full-resolution decode
 * only wastes memory.
 */
internal object ContactPhotoDecoder {
  // Matches the display-photo dimension of AOSP's contacts provider.
  private const val FALLBACK_MAX_DIM = 720

  fun decode(contentResolver: ContentResolver, uri: Uri): Bitmap {
    val longestEdge = readLongestEdge(contentResolver, uri)
    val sampleSize = calculateInSampleSize(longestEdge, contentResolver.maxDisplayPhotoDim())
    return decodeBitmap(contentResolver, uri, sampleSize)
  }

  private fun readLongestEdge(contentResolver: ContentResolver, uri: Uri): Int {
    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, options) }
    return maxOf(options.outWidth, options.outHeight)
  }

  // Keeps the decoded edge at or above maxDim so the provider does the final scale.
  private fun calculateInSampleSize(longestEdge: Int, maxDim: Int): Int {
    var sampleSize = 1
    while (longestEdge / (sampleSize * 2) >= maxDim) {
      sampleSize *= 2
    }
    return sampleSize
  }

  private fun decodeBitmap(contentResolver: ContentResolver, uri: Uri, sampleSize: Int): Bitmap {
    val options = BitmapFactory.Options().apply { inSampleSize = sampleSize }
    return contentResolver.openInputStream(uri)
      ?.use { BitmapFactory.decodeStream(it, null, options) }
      ?: throw ImageDecodingException(uri)
  }

  private fun ContentResolver.maxDisplayPhotoDim(): Int =
    runCatching {
      query(
        ContactsContract.DisplayPhoto.CONTENT_MAX_DIMENSIONS_URI,
        arrayOf(ContactsContract.DisplayPhoto.DISPLAY_MAX_DIM),
        null,
        null,
        null
      )?.use { cursor ->
        if (cursor.moveToFirst()) {
          cursor.getColumnIndex(ContactsContract.DisplayPhoto.DISPLAY_MAX_DIM)
            .takeIf { it >= 0 }
            ?.let { cursor.getInt(it) }
            ?.takeIf { it > 0 }
        } else {
          null
        }
      }
    }.getOrNull() ?: FALLBACK_MAX_DIM
}
