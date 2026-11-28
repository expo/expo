package expo.modules.video.transport

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSource
import expo.modules.video.records.VideoSource

/**
 * Stores and resolves the [VideoDataSourceProvider]s used by `expo-video`, the
 * counterpart of `VideoAssetTransportRegistry` on iOS.
 *
 * Modules register providers at startup. When `expo-video` builds a media
 * source, it asks the providers, by priority, for a [DataSource.Factory]; the
 * first one returned is used. Providers are identified by `identifier`:
 * registering one with an existing identifier replaces it in place. When
 * priorities are equal, the earlier registration wins.
 */
@OptIn(UnstableApi::class)
object VideoDataSourceRegistry {
  private class Entry(val registrationOrder: Int, var provider: VideoDataSourceProvider)

  private val lock = Any()
  private val entries = ArrayList<Entry>()
  private var nextRegistrationOrder = 0

  /** Registers or replaces a provider. */
  @JvmStatic
  fun registerProvider(provider: VideoDataSourceProvider) {
    synchronized(lock) {
      val existing = entries.firstOrNull { it.provider.identifier == provider.identifier }
      if (existing != null) {
        existing.provider = provider
        return
      }
      entries.add(Entry(nextRegistrationOrder++, provider))
    }
  }

  /** Removes the provider with the matching identifier. */
  @JvmStatic
  fun unregisterProvider(withId: String) {
    synchronized(lock) {
      entries.removeAll { it.provider.identifier == withId }
    }
  }

  internal fun resolveDataSourceFactory(videoSource: VideoSource): DataSource.Factory? {
    val descriptor = VideoDataSourceDescriptor.from(videoSource) ?: return null
    val ordered = synchronized(lock) {
      entries.sortedWith(
        compareByDescending<Entry> { it.provider.priority }.thenBy { it.registrationOrder }
      ).map { it.provider }
    }
    for (provider in ordered) {
      provider.makeDataSourceFactory(descriptor)?.let { return it }
    }
    return null
  }
}
