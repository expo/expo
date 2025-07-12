package expo.modules.imagepicker.exporters

import android.content.ContentResolver
import android.net.Uri
import android.provider.MediaStore
import expo.modules.imagepicker.MediaType

/*
* Returns the date associated to the file. As displayed in the system media library.
* If the user import an image without exif, then the system populate the Media.DATE_TAKEN value from the file creation date.
* If the user changes the date from the system gallery app, then the Media.DATE_TAKEN value is updated.
* Returns null if the sourceUrl comes from a camera image not added to the gallery yet.
*/
class DateExporter {
  fun date(contentResolver: ContentResolver, sourceUri: Uri, mediaType: MediaType): Long? {
    val mediaColumn = when (mediaType) {
      MediaType.IMAGE -> MediaStore.Images.Media.DATE_TAKEN
      MediaType.VIDEO -> MediaStore.Video.Media.DATE_TAKEN
    }

    return contentResolver.query(sourceUri, arrayOf(mediaColumn), null, null, null)?.use { cursor ->
      if (cursor.moveToFirst()) {
        runCatching {
          cursor.getLong(cursor.getColumnIndexOrThrow(mediaColumn))
        }.getOrNull()
      } else {
        null
      }
    }
  }
}
