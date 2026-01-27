package expo.modules.medialibrary.next.extensions.resolver

import android.database.Cursor
import android.provider.MediaStore

data class AssetMediaStoreItem(
  val displayName: String?,
  val height: Int?,
  val width: Int?,
  val dateTaken: Long?,
  val dateModified: Long?,
  val duration: Long?,
  val data: String?,
  val bucketId: String?
)

class AssetMediaStoreItemBuilder {
  private var displayName: String? = null
  private var height: Int? = null
  private var width: Int? = null
  private var dateTaken: Long? = null
  private var dateModified: Long? = null
  private var duration: Long? = null
  private var data: String? = null
  private var bucketId: String? = null

  fun build(): AssetMediaStoreItem {
    return AssetMediaStoreItem(
      displayName = displayName,
      height = height,
      width = width,
      dateTaken = dateTaken,
      dateModified = dateModified,
      duration = duration,
      data = data,
      bucketId = bucketId
    )
  }

  fun Cursor.set(property: AssetMediaStoreProperty) {
    with(property) {
      when (property) {
        AssetMediaStoreProperty.Data -> data = getString()
        AssetMediaStoreProperty.DisplayName -> displayName = getString()
        AssetMediaStoreProperty.Height -> height = getInt()
        AssetMediaStoreProperty.Width -> width = getInt()
        AssetMediaStoreProperty.DateTaken -> dateTaken = getLong()
        AssetMediaStoreProperty.DateModified -> dateModified = getLong()
        AssetMediaStoreProperty.Duration -> duration = getLong()
        AssetMediaStoreProperty.BucketId -> bucketId = getString()
      }
    }
  }

  companion object {
    fun Cursor.buildAssetMediaStoreItem(includeDuration: Boolean): AssetMediaStoreItem {
      val assetMediaStoreItemBuilder = AssetMediaStoreItemBuilder()
      AssetMediaStoreProperty
        .values()
        .filter { includeDuration || it != AssetMediaStoreProperty.Duration }
        .forEach {
          with(assetMediaStoreItemBuilder) {
            set(it)
          }
        }
      return assetMediaStoreItemBuilder.build()
    }
  }
}

enum class AssetMediaStoreProperty(val column: String) {
  DisplayName(MediaStore.Files.FileColumns.DISPLAY_NAME),
  Height(MediaStore.MediaColumns.HEIGHT),
  Width(MediaStore.MediaColumns.WIDTH),
  DateTaken(MediaStore.Images.ImageColumns.DATE_TAKEN),
  DateModified(MediaStore.MediaColumns.DATE_MODIFIED),
  Duration(MediaStore.MediaColumns.DURATION),
  Data(MediaStore.MediaColumns.DATA),
  BucketId(MediaStore.MediaColumns.BUCKET_ID);

  fun Cursor.columnIndex(): Int =
    getColumnIndexOrThrow(column)

  fun Cursor.getString(): String? =
    getString(columnIndex())

  fun Cursor.getInt(): Int? =
    getInt(columnIndex())

  fun Cursor.getLong(): Long? =
    getLong(columnIndex())

  companion object {
    fun projection(includeDuration: Boolean): Array<String> =
      values()
        .filter { includeDuration || it != Duration }
        .map { it.column }
        .toTypedArray()
  }
}
