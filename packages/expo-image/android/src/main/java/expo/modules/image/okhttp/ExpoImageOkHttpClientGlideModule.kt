package expo.modules.image.okhttp

import android.content.Context
import com.bumptech.glide.Glide
import com.bumptech.glide.Registry
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.integration.okhttp3.OkHttpUrlLoader
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.load.model.Headers
import com.bumptech.glide.module.LibraryGlideModule
import com.facebook.react.modules.network.CookieJarContainer
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.facebook.react.modules.network.OkHttpClientProvider
import com.facebook.react.modules.network.ReactCookieJarContainer
import expo.modules.image.events.OkHttpProgressListener
import okhttp3.Authenticator
import okhttp3.Call
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.JavaNetCookieJar
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
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
  private val cacheKey: String,
  /**
   * When set, this model is being used to seed the disk cache from a local file rather than
   * to display a remote image. [LocalFileGlideModelLoader] reads the file at this path and lets
   * Glide store its bytes under [cacheKey], so a later load using the same cache key hits the cache.
   */
  val localFilePath: String? = null
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

// CookieJarContainer does not expose its delegate. Retain its cookies and fall back to the
// shared store when it is empty. Response cookies go to both stores; other jars opt out.
internal fun OkHttpClient.withSharedCookies(): Call.Factory {
  val originalCookieJar = cookieJar
  if (originalCookieJar !is CookieJarContainer) {
    return this
  }
  val sharedCookieJar = ReactCookieJarContainer().apply {
    setCookieJar(JavaNetCookieJar(ForwardingCookieHandler()))
  }
  return Call.Factory { request ->
    var hasCookieHeader = false

    // OkHttp keys pooled connections by proxy authenticator, so wrappers compare their delegates.
    data class CookieHeaderAuthenticator(val delegate: Authenticator) : Authenticator {
      override fun authenticate(route: Route?, response: Response): Request? =
        delegate.authenticate(route, response)?.also { followUp ->
          // CONNECT authenticates the proxy tunnel, not the image request.
          if (followUp.method != "CONNECT") {
            hasCookieHeader = followUp.header("Cookie") != null
          }
        }
    }
    fun recordCookieHeader(authenticator: Authenticator): Authenticator =
      if (authenticator === Authenticator.NONE) {
        authenticator
      } else {
        CookieHeaderAuthenticator(authenticator)
      }

    newBuilder()
      .addInterceptor { chain ->
        // Factory interceptors may add a Cookie header before OkHttp applies cookies and checks the cache.
        hasCookieHeader = chain.request().header("Cookie") != null
        chain.proceed(chain.request())
      }
      .authenticator(recordCookieHeader(authenticator))
      .proxyAuthenticator(recordCookieHeader(proxyAuthenticator))
      .cookieJar(object : CookieJar {
        override fun loadForRequest(url: HttpUrl): List<Cookie> {
          val cookies = originalCookieJar.loadForRequest(url)
          return if (cookies.isNotEmpty() || hasCookieHeader) {
            cookies
          } else {
            sharedCookieJar.loadForRequest(url)
          }
        }

        override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
          originalCookieJar.saveFromResponse(url, cookies)
          sharedCookieJar.saveFromResponse(url, cookies)
        }
      })
      .build()
      .newCall(request)
  }
}

@GlideModule
class ExpoImageOkHttpClientGlideModule : LibraryGlideModule() {
  override fun registerComponents(context: Context, glide: Glide, registry: Registry) {
    val client = OkHttpClientProvider.createClient()
    // We don't use the `GlideUrl` directly but we want to replace the default okhttp loader anyway
    // to make sure that the app will use only one client.
    registry.replace(GlideUrl::class.java, InputStream::class.java, OkHttpUrlLoader.Factory(client.withSharedCookies()))
    registry.prepend(GlideUrlWrapper::class.java, InputStream::class.java, GlideUrlWrapperLoader.Factory(client))
    // Prepend so seeding models (those with a local file path) take precedence over the inherited
    // `GlideUrl` OkHttp loader. Regular `GlideUrlWithCustomCacheKey` loads have no path and fall through.
    registry.prepend(GlideUrlWithCustomCacheKey::class.java, InputStream::class.java, LocalFileGlideModelLoader.Factory())
  }
}
