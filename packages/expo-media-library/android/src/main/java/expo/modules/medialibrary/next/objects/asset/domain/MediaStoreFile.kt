package expo.modules.medialibrary.next.objects.asset.domain

import android.database.Cursor
import android.os.Build
import android.provider.MediaStore
import expo.modules.medialibrary.next.extensions.getNullableInt
import expo.modules.medialibrary.next.extensions.getNullableLong
import expo.modules.medialibrary.next.extensions.getNullableString

data class MediaStoreFile(
  val id: Long,
  val displayName: String?,
  val dateTaken: Long?,
  val dateModified: Long?,
  val width: Int?,
  val height: Int?,
  val duration: Long?,
  val mediaType: Int?,
  val isFavorite: Int?
) {
  companion object {
    fun from(
      cursor: Cursor,
      columnIndexes: MediaStoreFileColumnIndexes = MediaStoreFileColumnIndexes.from(cursor)
    ) = with(cursor) {
      MediaStoreFile(
        id = getLong(columnIndexes.id),
        displayName = getNullableString(columnIndexes.displayName),
        dateTaken = getNullableLong(columnIndexes.dateTaken),
        dateModified = getNullableLong(columnIndexes.dateModified),
        width = getNullableInt(columnIndexes.width),
        height = getNullableInt(columnIndexes.height),
        duration = columnIndexes.duration?.let { getNullableLong(it) },
        mediaType = getNullableInt(columnIndexes.mediaType),
        isFavorite = columnIndexes.isFavorite?.let { getNullableInt(it) }
      )
    }

    val projection = buildList {
      add(MediaStore.Files.FileColumns.MEDIA_TYPE)
      add(MediaStore.Files.FileColumns._ID)
      add(MediaStore.Files.FileColumns.DISPLAY_NAME)
      add(MediaStore.Files.FileColumns.DATE_TAKEN)
      add(MediaStore.Files.FileColumns.DATE_MODIFIED)
      add(MediaStore.Files.FileColumns.WIDTH)
      add(MediaStore.Files.FileColumns.HEIGHT)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        add(MediaStore.Files.FileColumns.DURATION)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        add(MediaStore.Files.FileColumns.IS_FAVORITE)
      }
    }.toTypedArray()
  }
}

data class MediaStoreFileColumnIndexes(
  val mediaType: Int,
  val id: Int,
  val displayName: Int,
  val dateTaken: Int,
  val dateModified: Int,
  val width: Int,
  val height: Int,
  val duration: Int?,
  val isFavorite: Int?
) {
  companion object {
    fun from(cursor: Cursor) = with(cursor) {
      MediaStoreFileColumnIndexes(
        mediaType = getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE),
        id = getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID),
        displayName = getColumnIndexOrThrow(MediaStore.Files.FileColumns.DISPLAY_NAME),
        dateTaken = getColumnIndexOrThrow(MediaStore.Files.FileColumns.DATE_TAKEN),
        dateModified = getColumnIndexOrThrow(MediaStore.Files.FileColumns.DATE_MODIFIED),
        width = getColumnIndexOrThrow(MediaStore.Files.FileColumns.WIDTH),
        height = getColumnIndexOrThrow(MediaStore.Files.FileColumns.HEIGHT),
        duration = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          getColumnIndexOrThrow(MediaStore.Files.FileColumns.DURATION)
        } else {
          null
        },
        isFavorite = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          getColumnIndexOrThrow(MediaStore.Files.FileColumns.IS_FAVORITE)
        } else {
          null
        }
      )
    }
  }
}
