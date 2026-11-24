package expo.modules.image.records

import expo.modules.image.enums.ImageCacheType
import expo.modules.image.enums.ImageTransitionCacheSkip
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class ImageTransition(
  @Field val duration: Int = 0,
  @Field val skipOnCacheHit: ImageTransitionCacheSkip = ImageTransitionCacheSkip.None
) : Record {
  fun shouldPlay(cacheType: ImageCacheType, isInitialDisplay: Boolean): Boolean {
    if (!isInitialDisplay) {
      return true
    }
    return !skipOnCacheHit.skips(cacheType)
  }
}
