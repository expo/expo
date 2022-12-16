package expo.modules.image.enums

import com.bumptech.glide.load.DataSource

enum class ImageCacheType(private vararg val dataSources: DataSource) {
  NONE(DataSource.LOCAL, DataSource.REMOTE),
  DISK(DataSource.DATA_DISK_CACHE, DataSource.RESOURCE_DISK_CACHE),
  MEMORY(DataSource.MEMORY_CACHE);

  companion object {
    fun fromNativeValue(value: DataSource): ImageCacheType =
      values().firstOrNull { it.dataSources.contains(value) } ?: NONE
  }
}
