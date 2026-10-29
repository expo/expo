package expo.modules.image

import com.bumptech.glide.load.Key
import com.bumptech.glide.load.engine.cache.DiskCache
import java.io.File

/**
 * https://github.com/expo/expo/issues/48442
 * https://github.com/bumptech/glide/issues/3550
 *
 * Glide skips writes for keys it already holds, so stored data that no decoder accepts can never be
 * replaced. It only redownloads after the stored copy failed to decode, so a write always means the
 * stored entry is unusable.
 * So we provide a custom disk cache that deletes an entry before writing to it
 */
internal class ExpoImageDiskCache(private val delegate: DiskCache) : DiskCache {
  override fun get(key: Key): File? = delegate.get(key)

  override fun put(key: Key, writer: DiskCache.Writer) {
    delegate.delete(key)
    delegate.put(key, writer)
  }

  override fun delete(key: Key) = delegate.delete(key)

  override fun clear() = delegate.clear()

  class Factory(private val delegate: DiskCache.Factory) : DiskCache.Factory {
    override fun build(): DiskCache? = delegate.build()?.let(::ExpoImageDiskCache)
  }
}
