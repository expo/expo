package expo.modules.medialibrary.next.objects.asset.domain

import android.database.Cursor
import android.os.Build
import android.provider.MediaStore
import expo.modules.medialibrary.next.objects.wrappers.MediaType

sealed interface AssetMediaStoreItem {
  data class Image(val asset: MediaStoreImageAsset) : AssetMediaStoreItem
  data class Video(val asset: MediaStoreVideoAsset) : AssetMediaStoreItem
  data class Audio(val asset: MediaStoreAudioAsset) : AssetMediaStoreItem

  companion object {
    fun from(
      cursor: Cursor,
      columnIndexes: AssetMediaStoreItemColumnIndexes = AssetMediaStoreItemColumnIndexes.from(cursor)
    ): AssetMediaStoreItem? = with(cursor) {
      when (MediaType.fromMediaStoreValue(getInt(columnIndexes.type))) {
        MediaType.IMAGE -> Image(MediaStoreImageAsset.from(this, columnIndexes.image))
        MediaType.VIDEO -> Video(MediaStoreVideoAsset.from(this, columnIndexes.video))
        MediaType.AUDIO -> Audio(MediaStoreAudioAsset.from(this, columnIndexes.audio))
        MediaType.UNKNOWN -> null
      }
    }

    val projection = buildList {
      add(MediaStore.Files.FileColumns.MEDIA_TYPE)
      add(MediaStore.Files.FileColumns._ID)
      add(MediaStore.Files.FileColumns.DISPLAY_NAME)
      add(MediaStore.Files.FileColumns.DATE_TAKEN)
      add(MediaStore.Files.FileColumns.DATE_MODIFIED)
      add(MediaStore.Files.FileColumns.WIDTH)
      add(MediaStore.Files.FileColumns.HEIGHT)
      add(MediaStore.Files.FileColumns.DATA)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        add(MediaStore.Files.FileColumns.DURATION)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        add(MediaStore.Files.FileColumns.IS_FAVORITE)
      }
    }.toTypedArray()
  }
}

// Different media types have different columns, for example duration is only available for video and audio
// Also, we want to query column indexes only once per query
data class AssetMediaStoreItemColumnIndexes(
  val type: Int,
  val image: MediaStoreImageAssetColumnIndexes,
  val video: MediaStoreVideoAssetColumnIndexes,
  val audio: MediaStoreAudioAssetColumnIndexes
) {
  companion object {
    fun from(cursor: Cursor) = AssetMediaStoreItemColumnIndexes(
      type = cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE),
      image = MediaStoreImageAssetColumnIndexes.from(cursor),
      video = MediaStoreVideoAssetColumnIndexes.from(cursor),
      audio = MediaStoreAudioAssetColumnIndexes.from(cursor)
    )
  }
}
