package expo.modules.image.enums

import com.bumptech.glide.load.DataSource

enum class ImageCacheType {
  UNKNOWN(DataSource.LOCAL, 0), NONE(DataSource.REMOTE, 1), DISK(arrayOf(
    DataSource.DATA_DISK_CACHE,
    DataSource.RESOURCE_DISK_CACHE
  ), 2),
  MEMORY(DataSource.MEMORY_CACHE, 3);

  private val mDataSources: Array<DataSource>
  val enumValue: Int

  constructor(dataSource: DataSource, enumValue: Int) {
    mDataSources = arrayOf(dataSource)
    this.enumValue = enumValue
  }

  constructor(dataSources: Array<DataSource>, enumValue: Int) {
    mDataSources = dataSources
    this.enumValue = enumValue
  }

  companion object {
    fun fromNativeValue(value: DataSource): ImageCacheType {
      for (cacheType in values()) {
        for (dataSource in cacheType.mDataSources) {
          if (dataSource == value) {
            return cacheType
          }
        }
      }
      return UNKNOWN
    }
  }
}