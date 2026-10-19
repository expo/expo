package expo.modules.image.enums

import expo.modules.kotlin.types.Enumerable

enum class ImageTransitionCacheSkip(val value: String) : Enumerable {
  None("none"),
  Memory("memory"),
  All("all");

  fun skips(cacheType: ImageCacheType): Boolean {
    return when (this) {
      None -> false
      Memory -> cacheType == ImageCacheType.MEMORY
      All -> cacheType == ImageCacheType.MEMORY || cacheType == ImageCacheType.DISK
    }
  }
}
