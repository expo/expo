package expo.modules.medialibrary.next.objects.asset.domain

import android.database.Cursor
import android.os.Build
import android.provider.MediaStore.Video.Media.*
import expo.modules.medialibrary.next.extensions.getNullableInt
import expo.modules.medialibrary.next.extensions.getNullableLong
import expo.modules.medialibrary.next.extensions.getNullableString

data class MediaStoreVideoAsset(
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
      columnIndexes: MediaStoreVideoAssetColumnIndexes = MediaStoreVideoAssetColumnIndexes.from(cursor)
    ) = with(cursor) {
      MediaStoreVideoAsset(
        id = getLong(columnIndexes.id),
        displayName = getNullableString(columnIndexes.displayName),
        dateTaken = getNullableLong(columnIndexes.dateTaken),
        dateModified = getNullableLong(columnIndexes.dateModified),
        width = getNullableInt(columnIndexes.width),
        height = getNullableInt(columnIndexes.height),
        duration = columnIndexes.duration?.let { getNullableLong(it) },
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
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        add(DURATION)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        add(IS_FAVORITE)
      }
    }.toTypedArray()
  }
}

data class MediaStoreVideoAssetColumnIndexes(
  val id: Int,
  val displayName: Int,
  val dateTaken: Int,
  val dateModified: Int,
  val width: Int,
  val height: Int,
  val duration: Int?,
  val data: Int,
  val isFavorite: Int?
) {
  companion object {
    fun from(cursor: Cursor) = with(cursor) {
      MediaStoreVideoAssetColumnIndexes(
        id = getColumnIndexOrThrow(_ID),
        displayName = getColumnIndexOrThrow(DISPLAY_NAME),
        dateTaken = getColumnIndexOrThrow(DATE_TAKEN),
        dateModified = getColumnIndexOrThrow(DATE_MODIFIED),
        width = getColumnIndexOrThrow(WIDTH),
        height = getColumnIndexOrThrow(HEIGHT),
        duration = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          getColumnIndexOrThrow(DURATION)
        } else {
          null
        },
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
