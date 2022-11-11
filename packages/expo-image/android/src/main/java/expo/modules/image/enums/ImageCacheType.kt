package expo.modules.image.enums

import com.bumptech.glide.load.DataSource

enum class ImageCacheType(private val dataSources: Array<DataSource>, val enumValue: Int) {
  UNKNOWN(DataSource.LOCAL, 0),
  NONE(DataSource.REMOTE, 1),
  DISK(
    arrayOf(
      DataSource.DATA_DISK_CACHE,
      DataSource.RESOURCE_DISK_CACHE
    ),
    2
  ),
  MEMORY(DataSource.MEMORY_CACHE, 3);

  constructor(dataSource: DataSource, enumValue: Int) : this(arrayOf(dataSource), enumValue)

  companion object {
    fun fromNativeValue(value: DataSource): ImageCacheType =
      values().firstOrNull { it.dataSources.contains(value) } ?: UNKNOWN
  }
}
