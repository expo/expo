package expo.modules.video

import android.content.Context
import android.content.pm.ApplicationInfo
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.common.util.Util
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.MediaSource
import expo.modules.video.cache.CachePolicy
import expo.modules.video.cache.CacheVariantIndex
import expo.modules.video.cache.ExpoVideoCacheKeyFactory
import expo.modules.video.records.VideoSource
import expo.modules.video.managers.VideoManager
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.ResponseBody.Companion.asResponseBody
import okio.ForwardingSource
import okio.buffer

@OptIn(UnstableApi::class)
fun buildBaseDataSourceFactory(
  context: Context,
  videoSource: VideoSource,
  cacheStorageKey: String? = null
): DataSource.Factory {
  return if (videoSource.uri?.scheme?.startsWith("http") == true) {
    buildOkHttpDataSourceFactory(context, videoSource, cacheStorageKey)
  } else {
    DefaultDataSource.Factory(context)
  }
}

@OptIn(UnstableApi::class)
fun buildOkHttpDataSourceFactory(
  context: Context,
  videoSource: VideoSource,
  cacheStorageKey: String? = null
): OkHttpDataSource.Factory {
  val clientBuilder = OkHttpClient.Builder()
  if (videoSource.useCaching) {
    clientBuilder.addNetworkInterceptor(buildCacheVariantRecorder(context, videoSource, cacheStorageKey))
  }
  val client = clientBuilder.build()

  // If the application name has ANY non-ASCII characters, we need to strip them out. This is because using non-ASCII characters
  // in the User-Agent header can cause issues with getting the media to play.
  val applicationName = getApplicationName(context).filter { it.code in 0..127 }

  val defaultUserAgent = Util.getUserAgent(context, applicationName)

  return OkHttpDataSource.Factory(client).apply {
    val headers = videoSource.headers
    headers?.takeIf { it.isNotEmpty() }?.let {
      setDefaultRequestProperties(it)
    }
    val userAgent = headers?.get("User-Agent") ?: defaultUserAgent
    setUserAgent(userAgent)
  }
}

@OptIn(UnstableApi::class)
fun buildCacheDataSourceFactory(
  context: Context,
  videoSource: VideoSource
): DataSource.Factory {
  val requestHeaders = videoSource.headers ?: emptyMap()
  val sourceUrl = videoSource.uri?.toString()
  val storageKeyResult = sourceUrl?.let { CacheVariantIndex.storageKeyResult(context, it, requestHeaders) }
  val storageKey = storageKeyResult?.storageKey
  if (storageKeyResult?.canReadFromCache != true) {
    if (sourceUrl != null && storageKey != null) {
      evictCacheEntry(sourceUrl, storageKey)
    }
  }
  return CacheDataSource.Factory().apply {
    setCache(VideoManager.cache.instance)
    setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
    setCacheKeyFactory(ExpoVideoCacheKeyFactory(context, requestHeaders, sourceUrl, storageKey))
    setUpstreamDataSourceFactory(buildBaseDataSourceFactory(context, videoSource, storageKey))
  }
}

@OptIn(UnstableApi::class)
private fun buildCacheVariantRecorder(
  context: Context,
  videoSource: VideoSource,
  cacheStorageKey: String?
): Interceptor {
  // Captured once: the original `videoSource.uri` is what later cache reads
  // key against, even if the network response was reached through redirects.
  // `Vary` is intentionally read from the terminal response seen by Media3.
  val sourceUrl = videoSource.uri?.toString()
  val requestHeaders = videoSource.headers ?: emptyMap()
  return Interceptor { chain ->
    val response = chain.proceed(chain.request())
    if (sourceUrl != null) {
      val responseHeaders = response.headers
        .toMultimap()
        .mapValues { it.value.joinToString(separator = ",") }
      val policy = CachePolicy.evaluate(responseHeaders, response.code)
      val storageKey = cacheStorageKey ?: CacheVariantIndex.storageKey(context, sourceUrl, requestHeaders)

      if (!policy.isCacheable) {
        evictCacheEntry(sourceUrl, storageKey)
        return@Interceptor response.evictAfterClose {
          evictCacheEntry(sourceUrl, storageKey)
        }
      }
      CacheVariantIndex.recordVariant(context, sourceUrl, storageKey, requestHeaders, policy)
    }
    response
  }
}

@OptIn(UnstableApi::class)
private fun Response.evictAfterClose(onClose: () -> Unit): Response {
  val originalBody = body
    ?: return this
  val wrappedSource = object : ForwardingSource(originalBody.source()) {
    private var fired = false
    override fun close() {
      try {
        super.close()
      } finally {
        if (!fired) {
          fired = true
          onClose()
        }
      }
    }
  }
  return newBuilder()
    .body(wrappedSource.buffer().asResponseBody(originalBody.contentType(), originalBody.contentLength()))
    .build()
}

@OptIn(UnstableApi::class)
private fun evictCacheEntry(url: String, storageKey: String) {
  val cacheKey = if (storageKey.isEmpty()) url else "$url#$storageKey"
  try {
    VideoManager.cache.instance.removeResource(cacheKey)
  } catch (e: Exception) {
    // Cache may be released or the key may not exist yet; either way nothing to evict.
  }
}

fun buildMediaSourceFactory(context: Context, dataSourceFactory: DataSource.Factory): MediaSource.Factory {
  return DefaultMediaSourceFactory(context).setDataSourceFactory(dataSourceFactory)
}

@OptIn(UnstableApi::class)
fun buildExpoVideoMediaSource(
  context: Context,
  videoSource: VideoSource
): MediaSource {
  val dataSourceFactory = if (videoSource.useCaching) {
    buildCacheDataSourceFactory(context, videoSource)
  } else {
    buildBaseDataSourceFactory(context, videoSource)
  }
  val mediaSourceFactory = buildMediaSourceFactory(context, dataSourceFactory)
  val mediaItem = videoSource.toMediaItem(context)
  return mediaSourceFactory.createMediaSource(mediaItem)
}

private fun getApplicationName(context: Context): String {
  val applicationInfo: ApplicationInfo = context.applicationInfo
  val stringId = applicationInfo.labelRes
  return if (stringId == 0) applicationInfo.nonLocalizedLabel.toString() else context.getString(stringId)
}
