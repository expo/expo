package expo.modules.medialibrary.next.objects.asset.domain

import android.database.Cursor
import android.os.Build
import android.provider.MediaStore.Audio.Media.*
import expo.modules.medialibrary.next.extensions.getNullableInt
import expo.modules.medialibrary.next.extensions.getNullableLong
import expo.modules.medialibrary.next.extensions.getNullableString

data class MediaStoreAudioAsset(
  val id: Long,
  val displayName: String?,
  val dateTaken: Long?,
  val dateModified: Long?,
  val duration: Long?,
  val data: String?,
  val isFavorite: Int?
) {
  companion object {
    fun from(
      cursor: Cursor,
      columnIndexes: MediaStoreAudioAssetColumnIndexes = MediaStoreAudioAssetColumnIndexes.from(cursor)
    ) = with(cursor) {
      MediaStoreAudioAsset(
        id = getLong(columnIndexes.id),
        displayName = getNullableString(columnIndexes.displayName),
        dateTaken = getNullableLong(columnIndexes.dateTaken),
        dateModified = getNullableLong(columnIndexes.dateModified),
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

data class MediaStoreAudioAssetColumnIndexes(
  val id: Int,
  val displayName: Int,
  val dateTaken: Int,
  val dateModified: Int,
  val duration: Int?,
  val data: Int,
  val isFavorite: Int?
) {
  companion object {
    fun from(cursor: Cursor) = with(cursor) {
      MediaStoreAudioAssetColumnIndexes(
        id = getColumnIndexOrThrow(_ID),
        displayName = getColumnIndexOrThrow(DISPLAY_NAME),
        dateTaken = getColumnIndexOrThrow(DATE_TAKEN),
        dateModified = getColumnIndexOrThrow(DATE_MODIFIED),
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
