package expo.modules.image.enums;

import com.bumptech.glide.load.DataSource;

public enum ImageCacheType {
  UNKNOWN(DataSource.LOCAL, 0),
  NONE(DataSource.REMOTE, 1),
  DISK(new DataSource[]{
      DataSource.DATA_DISK_CACHE,
      DataSource.RESOURCE_DISK_CACHE
  }, 2),
  MEMORY(DataSource.MEMORY_CACHE, 3);

  private final DataSource[] mDataSources;
  private final int mEnumValue;

  ImageCacheType(DataSource dataSource, int enumValue) {
    mDataSources = new DataSource[]{dataSource};
    mEnumValue = enumValue;
  }

  ImageCacheType(DataSource[] dataSources, int enumValue) {
    mDataSources = dataSources;
    mEnumValue = enumValue;
  }

  public int getEnumValue() {
    return mEnumValue;
  }

  public static ImageCacheType fromNativeValue(DataSource value) {
    for (ImageCacheType cacheType : ImageCacheType.values()) {
      for (DataSource dataSource : cacheType.mDataSources) {
        if (dataSource == value) {
          return cacheType;
        }
      }
    }
    return ImageCacheType.UNKNOWN;
  }
}
