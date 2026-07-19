// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.network

import android.content.Context
import android.net.ConnectivityManager
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.expoview.ExpoViewBuildConfig
import okhttp3.Cache
import okhttp3.OkHttpClient
import java.io.File
import java.io.IOException
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Singleton
class ExponentNetwork constructor(
  contextArg: Context,
  val exponentSharedPreferences: ExponentSharedPreferences
) {
  val context: Context = contextArg.applicationContext
  val client = ExponentHttpClient(
    context,
    object : OkHttpClientFactory {
      override fun getNewClient(): OkHttpClient = createHttpClientBuilder().build()
    }
  )
  val longTimeoutClient = ExponentHttpClient(
    context,
    object : OkHttpClientFactory {
      override fun getNewClient(): OkHttpClient = createHttpClientBuilder()
        .readTimeout(2, TimeUnit.MINUTES)
        .build()
    }
  )

  // Warning: this doesn't WRITE to the cache either. Don't use this to populate the cache in the background.
  val noCacheClient: OkHttpClient = OkHttpClient.Builder().build()

  interface OkHttpClientFactory {
    fun getNewClient(): OkHttpClient
  }

  private fun createHttpClientBuilder(): OkHttpClient.Builder {
    val clientBuilder = OkHttpClient.Builder()
      .cache(cache)
    if (ExpoViewBuildConfig.DEBUG) {
      // FIXME: 8/9/17
      // clientBuilder.addNetworkInterceptor(new StethoInterceptor());
    }
    return clientBuilder
  }

  val cache: Cache
    get() {
      val cacheSize = 50 * 1024 * 1024 // 50 MiB
      val directory = File(context.cacheDir, CACHE_DIR)
      return Cache(directory, cacheSize.toLong())
    }

  companion object {
    private val TAG = ExponentNetwork::class.java.simpleName

    const val IGNORE_INTERCEPTORS_HEADER = "exponentignoreinterceptors"

    private const val CACHE_DIR = "http-cache"
    private const val LEGACY_CACHE_DIR = "okhttp"

    // This fixes OkHttp bug where if you don't read a response, it'll never cache that request in the future
    @Throws(IOException::class)
    fun flushResponse(response: ExpoResponse) {
      response.body().bytes()
    }

    fun isNetworkAvailable(context: Context): Boolean {
      val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
      val activeNetworkInfo = connectivityManager.activeNetworkInfo
      return activeNetworkInfo != null && activeNetworkInfo.isConnected
    }
  }
}
