package expo.modules.image.okhttp

import android.content.Context
import com.bumptech.glide.Glide
import com.bumptech.glide.Registry
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.integration.okhttp3.OkHttpUrlLoader
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.load.model.Headers
import com.bumptech.glide.module.LibraryGlideModule
import expo.modules.image.events.OkHttpProgressListener
import okhttp3.OkHttpClient
import java.io.InputStream

/**
 * GlideUrl with custom cache key.
 * It wraps the base implementation and overrides logic behind cache key and when two
 * objects are equal. Typically, Glide uses the only cache key to compare objects.
 * It won't suit our use case. We want to make custom cache key transparent and
 * not use it to compare objects.
 */
class GlideUrlWithCustomCacheKey(
  uri: String?,
  headers: Headers?,
  private val cacheKey: String
) : GlideUrl(uri, headers) {
  /**
   * Cached hash code value
   */
  private var hashCode = 0

  /**
   * @return a super cache key from [GlideUrl]
   */
  private fun getBaseCacheKey(): String = super.getCacheKey()

  override fun getCacheKey(): String = cacheKey

  // Mostly copied from GlideUrl::equal
  override fun equals(other: Any?): Boolean {
    if (other is GlideUrlWithCustomCacheKey) {
      return getBaseCacheKey() == other.getBaseCacheKey() && headers.equals(other.headers)
    } else if (other is GlideUrl) {
      return getBaseCacheKey() == other.cacheKey && headers.equals(other.headers)
    }
    return false
  }

  // Mostly copied from GlideUrl::hashCode
  override fun hashCode(): Int {
    if (hashCode == 0) {
      hashCode = getBaseCacheKey().hashCode()
      hashCode = 31 * hashCode + headers.hashCode()
    }
    return hashCode
  }
}

/**
 * To connect listener with the request we have to create custom model.
 * In that way, we're passing more information to the final data loader.
 */
data class GlideUrlWrapper(val glideUrl: GlideUrl) {
  var progressListener: OkHttpProgressListener? = null

  override fun toString(): String {
    return glideUrl.toString()
  }
}

@GlideModule
class ExpoImageOkHttpClientGlideModule : LibraryGlideModule() {
  override fun registerComponents(context: Context, glide: Glide, registry: Registry) {
    val client = OkHttpClient()
    // We don't use the `GlideUrl` directly but we want to replace the default okhttp loader anyway
    // to make sure that the app will use only one client.
    registry.replace(GlideUrl::class.java, InputStream::class.java, OkHttpUrlLoader.Factory(client))
    registry.prepend(GlideUrlWrapper::class.java, InputStream::class.java, GlideUrlWrapperLoader.Factory(client))
  }
}
