package expo.modules.image.okhttp

import com.bumptech.glide.Priority
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.data.DataFetcher
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.load.model.ModelLoaderFactory
import com.bumptech.glide.load.model.MultiModelLoaderFactory
import java.io.File
import java.io.FileInputStream
import java.io.InputStream

/**
 * Reads the bytes of a local file referenced by [GlideUrlWithCustomCacheKey.localFilePath] while
 * keeping the model as the source key, so Glide stores those bytes in its disk cache under the
 * model's custom cache key. This is what lets `Image.writeToCacheAsync` seed the cache: a later
 * load that uses the same cache key resolves to the same disk entry.
 *
 * It only handles seeding models (those with a non-null `localFilePath`). Regular remote loads keep
 * using the OkHttp-based `GlideUrl` loader, so display behavior is unaffected.
 */
class LocalFileGlideModelLoader : ModelLoader<GlideUrlWithCustomCacheKey, InputStream> {
  override fun handles(model: GlideUrlWithCustomCacheKey): Boolean = model.localFilePath != null

  override fun buildLoadData(
    model: GlideUrlWithCustomCacheKey,
    width: Int,
    height: Int,
    options: Options
  ): ModelLoader.LoadData<InputStream>? {
    val localFilePath = model.localFilePath ?: return null
    // Passing `model` as the source key makes Glide derive the disk cache key from its custom cache key.
    return ModelLoader.LoadData(model, LocalFileFetcher(File(localFilePath)))
  }

  class Factory : ModelLoaderFactory<GlideUrlWithCustomCacheKey, InputStream> {
    override fun build(multiFactory: MultiModelLoaderFactory): ModelLoader<GlideUrlWithCustomCacheKey, InputStream> {
      return LocalFileGlideModelLoader()
    }

    override fun teardown() = Unit
  }

  private class LocalFileFetcher(
    private val file: File
  ) : DataFetcher<InputStream> {
    private var stream: InputStream? = null

    override fun loadData(priority: Priority, callback: DataFetcher.DataCallback<in InputStream>) {
      try {
        val opened = FileInputStream(file)
        stream = opened
        callback.onDataReady(opened)
      } catch (e: Exception) {
        callback.onLoadFailed(e)
      }
    }

    override fun cleanup() {
      try {
        stream?.close()
      } catch (_: Exception) {
        // Ignore failures while closing the stream.
      }
      stream = null
    }

    override fun cancel() = Unit

    override fun getDataClass(): Class<InputStream> = InputStream::class.java

    // Must not be `DATA_DISK_CACHE` or `MEMORY_CACHE`, otherwise `DiskCacheStrategy.DATA` won't store the data.
    override fun getDataSource(): DataSource = DataSource.LOCAL
  }
}
