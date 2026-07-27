package expo.modules.medialibrary.next.objects.asset.domain

import android.database.Cursor
import android.os.Build
import android.provider.MediaStore.Video.VideoColumns.*
import expo.modules.medialibrary.next.extensions.getNullableInt
import expo.modules.medialibrary.next.extensions.getNullableLong
import expo.modules.medialibrary.next.extensions.getNullableString

data class MediaStoreVideo(
  val id: Long,
  val displayName: String?,
  val dateTaken: Long?,
  val dateModified: Long?,
  val width: Int?,
  val height: Int?,
  val duration: Long?,
  val data: String?,
  val isFavorite: Int?
) {
  companion object {
    fun from(
      cursor: Cursor,
      columnIndexes: MediaStoreVideoColumnIndexes = MediaStoreVideoColumnIndexes.from(cursor)
    ) = with(cursor) {
      MediaStoreVideo(
        id = getLong(columnIndexes.id),
        displayName = getNullableString(columnIndexes.displayName),
        dateTaken = getNullableLong(columnIndexes.dateTaken),
        dateModified = getNullableLong(columnIndexes.dateModified),
        width = getNullableInt(columnIndexes.width),
        height = getNullableInt(columnIndexes.height),
        duration = getNullableLong(columnIndexes.duration),
        data = getNullableString(columnIndexes.data),
        isFavorite = columnIndexes.isFavorite?.let { getNullableInt(it) }
      )
    }

    val projection = buildList {
      add(_ID)
      add(DISPLAY_NAME)
      add(DATE_TAKEN)
      add(DATE_MODIFIED)
      add(WIDTH)
      add(HEIGHT)
      add(DATA)
      add(DURATION)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        add(IS_FAVORITE)
      }
    }.toTypedArray()
  }
}

data class MediaStoreVideoColumnIndexes(
  val id: Int,
  val displayName: Int,
  val dateTaken: Int,
  val dateModified: Int,
  val width: Int,
  val height: Int,
  val duration: Int,
  val data: Int,
  val isFavorite: Int?
) {
  companion object {
    fun from(cursor: Cursor) = with(cursor) {
      MediaStoreVideoColumnIndexes(
        id = getColumnIndexOrThrow(_ID),
        displayName = getColumnIndexOrThrow(DISPLAY_NAME),
        dateTaken = getColumnIndexOrThrow(DATE_TAKEN),
        dateModified = getColumnIndexOrThrow(DATE_MODIFIED),
        width = getColumnIndexOrThrow(WIDTH),
        height = getColumnIndexOrThrow(HEIGHT),
        duration = getColumnIndexOrThrow(DURATION),
        data = getColumnIndexOrThrow(DATA),
        isFavorite = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          getColumnIndexOrThrow(IS_FAVORITE)
        } else {
          null
        }
      )
    }
  }
}
