package expo.modules.video.cache

import android.content.Context
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.cache.CacheKeyFactory

/**
 * Cache key factory that folds request headers into the Media3 cache key per
 * RFC 9111 `Vary` semantics. The base `CacheDataSource` keys cached chunks
 * solely by URL, which would cross-pollinate authenticated responses across
 * identities. The variant key disambiguates by the request-header values the
 * server (or our conservative default) marks as identity-bearing.
 */
@OptIn(UnstableApi::class)
internal class ExpoVideoCacheKeyFactory(
  private val context: Context,
  private val requestHeaders: Map<String, String>,
  private val sourceUrl: String?,
  private val sourceStorageKey: String?
) : CacheKeyFactory {
  override fun buildCacheKey(dataSpec: DataSpec): String {
    val url = dataSpec.uri.toString()
    val variantKey = if (url == sourceUrl && sourceStorageKey != null) {
      sourceStorageKey
    } else {
      CacheVariantIndex.storageKey(context, url, requestHeaders)
    }
    return if (variantKey.isEmpty()) url else "$url#$variantKey"
  }
}
