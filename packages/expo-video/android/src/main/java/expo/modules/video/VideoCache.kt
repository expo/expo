package expo.modules.video

import android.content.Context
import android.os.Looper
import android.util.Log
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.DatabaseProvider
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import expo.modules.kotlin.exception.Exceptions
import java.io.File
import java.lang.ref.WeakReference
import java.util.UUID

@UnstableApi
class VideoCache(context: Context) {
  // We don't want a strong reference to the context, as this class is used inside of a singleton (VideoManager)
  private val weakContext: WeakReference<Context> = WeakReference(context)
  private val context: Context
    get() {
      return weakContext.get() ?: throw Exceptions.ReactContextLost()
    }
  private val databaseProvider: DatabaseProvider = StandaloneDatabaseProvider(context)
  private var cacheEvictor: LeastRecentlyUsedCacheEvictor
  private val sharedPreferences = context.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE)
  var instance: SimpleCache

  init {
    cacheEvictor = LeastRecentlyUsedCacheEvictor(getMaxCacheSize())
    instance = SimpleCache(getCacheDir(), cacheEvictor, databaseProvider)
  }

  // Function that gets the cache size from shared preferences
  private fun getMaxCacheSize(): Long {
    return sharedPreferences.getLong(CACHE_SIZE_KEY, DEFAULT_CACHE_SIZE)
  }

  fun setMaxCacheSize(size: Long) {
    assertModificationReleaseConditions()
    instance.release()
    sharedPreferences.edit().putLong(CACHE_SIZE_KEY, size).apply()
    cacheEvictor = LeastRecentlyUsedCacheEvictor(size)
    instance = SimpleCache(getCacheDir(), cacheEvictor, databaseProvider)
  }

  fun getCurrentCacheSize(): Long {
    return getFileSize(getCacheDir())
  }

  // We have to keep the current directory name in the shared preferences, when the cache is released, a new name will be assigned to avoid conflicts.
  private fun getCacheDir(): File {
    // Weird structure, because kotlin marks the result of `getString` as nullable
    val videoCacheDirName = sharedPreferences.getString(VIDEO_CACHE_DIR_KEY, null) ?: run {
      val newCacheDirName = generateCacheDirName()
      sharedPreferences.edit().putString(VIDEO_CACHE_DIR_KEY, newCacheDirName).apply()
      newCacheDirName
    }
    val cacheParentDir = File(context.cacheDir, VIDEO_CACHE_PARENT_DIR)
    val cacheDir = File(cacheParentDir, videoCacheDirName)

    if (!cacheDir.exists()) {
      cacheDir.mkdirs()
    }
    return cacheDir
  }

  private fun generateCacheDirName(): String {
    return UUID.randomUUID().toString()
  }

  fun clear() {
    assertModificationReleaseConditions()

    // Creates a new cache directory to avoid conflicts while removing the old cache
    val oldCacheDirectory = getCacheDir()
    val oldCache = instance
    val newCacheName = generateCacheDirName()

    sharedPreferences.edit().putString(VIDEO_CACHE_DIR_KEY, newCacheName).apply()
    instance = SimpleCache(getCacheDir(), cacheEvictor, databaseProvider)
    oldCache.release()
    deleteRecursive(oldCacheDirectory)
  }

  private fun deleteRecursive(fileOrDirectory: File) {
    if (fileOrDirectory.isDirectory) {
      for (child in fileOrDirectory.listFiles() ?: arrayOf()) {
        deleteRecursive(child)
      }
    }

    fileOrDirectory.delete()
  }

  private fun getFileSize(file: File): Long {
    var size: Long = 0
    if (file.isDirectory) {
      file.listFiles()?.forEach {
        size += getFileSize(it)
      }
    } else {
      size = file.length()
    }
    return size
  }

  private fun assertModificationReleaseConditions() {
    if (VideoManager.hasRegisteredPlayers()) {
      throw VideoCacheException("Cannot clear cache while there are active players")
    }

    if (Looper.myLooper() == Looper.getMainLooper()) {
      Log.w("ExpoVideo", "Clearing cache on the main thread, this might cause performance issues")
    }
  }

  companion object {
    private const val SHARED_PREFERENCES_NAME = "ExpoVideoCache"
    private const val CACHE_SIZE_KEY = "cacheSize"
    private const val VIDEO_CACHE_PARENT_DIR = "ExpoVideoCache"
    private const val VIDEO_CACHE_DIR_KEY = "cacheDir"
    private const val DEFAULT_CACHE_SIZE = 1024 * 1024 * 1024L // 1GB
  }
}
