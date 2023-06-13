package expo.modules.av.player.datasource

import androidx.collection.ArrayMap
import com.google.android.exoplayer2.upstream.HttpDataSource.BaseFactory
import com.google.android.exoplayer2.upstream.HttpDataSource.RequestProperties
import com.google.android.exoplayer2.ext.okhttp.OkHttpDataSource
import okhttp3.CacheControl
import okhttp3.Call

// Mainly a copy of com.google.android.exoplayer2.ext.okhttp.OkHttpDataSourceFactory,
// because it's declared as final :(
class CustomHeadersOkHttpDataSourceFactory(
  private val callFactory: Call.Factory,
  private val userAgent: String?,
  requestHeaders: Map<String, Any>?
) : BaseFactory() {
  private val cacheControl: CacheControl? = null

  private fun updateRequestProperties(requestHeaders: Map<String, Any>?) {
    if (requestHeaders != null) {
      val requestProperties = ArrayMap<String, String>()
      for ((key, value) in requestHeaders) {
        if (value is String) {
          requestProperties[key] = value
        }
      }
      setDefaultRequestProperties(requestProperties)
    }
  }

  override fun createDataSourceInternal(defaultRequestProperties: RequestProperties): OkHttpDataSource {
    return OkHttpDataSource(callFactory, userAgent, cacheControl, defaultRequestProperties)
  }

  init {
    updateRequestProperties(requestHeaders)
  }
}
