package abi44_0_0.host.exp.exponent.modules.universal.av

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

  private fun updateRequestProperties(
    requestProperties: RequestProperties,
    requestHeaders: Map<String, Any>?
  ) {
    if (requestHeaders != null) {
      for ((key, value) in requestHeaders) {
        if (value is String) {
          requestProperties[key] = value
        }
      }
    }
  }

  override fun createDataSourceInternal(defaultRequestProperties: RequestProperties): OkHttpDataSource {
    return OkHttpDataSource(callFactory, userAgent, null, cacheControl, defaultRequestProperties)
  }

  init {
    updateRequestProperties(defaultRequestProperties, requestHeaders)
  }
}
