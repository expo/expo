package expo.modules.contacts

import android.content.ContentResolver
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.provider.ContactsContract
import kotlin.math.max

/**
 * Decodes contact photos downsampled to the Contacts Provider's own display-photo limit.
 *
 * Photos decoded here are written straight back to the provider, which scales them to
 * [ContactsContract.DisplayPhoto.DISPLAY_MAX_DIM] on insert. Decoding at full resolution
 * first is therefore wasted work: a 12 MP camera photo allocates roughly 48 MB for a
 * bitmap that ends up at most a few hundred pixels on its longest edge.
 */
internal object ContactPhotoDecoder {
  // Used when the provider does not report a limit. Matches the display-photo
  // dimension shipped by AOSP's contacts provider.
  private const val FALLBACK_MAX_DIM = 720

  @Volatile
  private var cachedMaxDim: Int? = null

  fun decodeDownsampled(contentResolver: ContentResolver, uri: Uri): Bitmap? {
    val maxDim = maxDisplayPhotoDim(contentResolver)

    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, options) }

    // A failed bounds decode leaves outWidth/outHeight at -1, so the loop is skipped and
    // the second pass returns null exactly as an undecodable stream did before.
    options.inSampleSize = 1
    while (max(options.outWidth, options.outHeight) / options.inSampleSize > maxDim) {
      options.inSampleSize *= 2
    }
    options.inJustDecodeBounds = false

    return contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, options) }
  }

  private fun maxDisplayPhotoDim(contentResolver: ContentResolver): Int {
    cachedMaxDim?.let { return it }
    val dim = runCatching {
      contentResolver.query(
        ContactsContract.DisplayPhoto.CONTENT_MAX_DIMENSIONS_URI,
        arrayOf(ContactsContract.DisplayPhoto.DISPLAY_MAX_DIM),
        null,
        null,
        null
      )?.use { cursor ->
        if (cursor.moveToFirst()) cursor.getInt(0).takeIf { it > 0 } else null
      }
    }.getOrNull() ?: FALLBACK_MAX_DIM
    cachedMaxDim = dim
    return dim
  }
}