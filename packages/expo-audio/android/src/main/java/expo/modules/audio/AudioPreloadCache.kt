package expo.modules.audio

import android.content.Context
import androidx.core.net.toUri
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.CacheWriter
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.database.StandaloneDatabaseProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

private const val CACHE_DIR_NAME = "expo_audio_preload"
private const val MAX_CACHE_SIZE_BYTES = 100L * 1024 * 1024

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
object AudioPreloadCache {
  private val lock = Any()
  private var cache: SimpleCache? = null
  private val preloadedUris = mutableSetOf<String>()

  fun getCache(context: Context): SimpleCache = synchronized(lock) {
    cache ?: run {
      val cacheDir = File(context.cacheDir, CACHE_DIR_NAME)
      val evictor = LeastRecentlyUsedCacheEvictor(MAX_CACHE_SIZE_BYTES)
      val databaseProvider = StandaloneDatabaseProvider(context)
      SimpleCache(cacheDir, evictor, databaseProvider).also { cache = it }
    }
  }

  fun createCacheDataSourceFactory(
    context: Context,
    upstreamFactory: DataSource.Factory
  ): CacheDataSource.Factory =
    CacheDataSource.Factory()
      .setCache(getCache(context))
      .setUpstreamDataSourceFactory(upstreamFactory)
      .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)

  suspend fun preload(context: Context, uri: String, upstreamFactory: DataSource.Factory? = null) = withContext(Dispatchers.IO) {
    val factory = upstreamFactory ?: DefaultDataSource.Factory(context)
    val cacheDataSourceFactory = CacheDataSource.Factory()
      .setCache(getCache(context))
      .setUpstreamDataSourceFactory(factory)
      .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)

    val dataSpec = DataSpec.Builder().setUri(uri.toUri()).build()
    val dataSource = cacheDataSourceFactory.createDataSource()
    CacheWriter(dataSource, dataSpec, null, null).cache()
    synchronized(lock) { preloadedUris.add(uri) }
  }

  suspend fun clearSource(context: Context, uri: String) = withContext(Dispatchers.IO) {
    val simpleCache = getCache(context)
    simpleCache.getCachedSpans(uri).forEach { span ->
      simpleCache.removeSpan(span)
    }
    synchronized(lock) { preloadedUris.remove(uri) }
  }

  suspend fun clearAll(context: Context) = withContext(Dispatchers.IO) {
    synchronized(lock) {
      cache?.let { simpleCache ->
        simpleCache.keys.toList().forEach { key ->
          simpleCache.getCachedSpans(key).forEach { span ->
            simpleCache.removeSpan(span)
          }
        }
      }
      preloadedUris.clear()
    }
  }

  suspend fun release() = withContext(Dispatchers.IO) {
    synchronized(lock) {
      cache?.release()
      cache = null
      preloadedUris.clear()
    }
  }

  fun getPreloadedSources(): List<String> = synchronized(lock) {
    preloadedUris.toList()
  }
}
