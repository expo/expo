package expo.modules.video.transport

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSource

/**
 * Lets external modules customize how `expo-video` loads specific sources on
 * Android, the counterpart of `VideoAssetTransportProvider` on iOS.
 *
 * A provider inspects a [VideoDataSourceDescriptor] and, when it recognizes the
 * source, returns the Media3 [DataSource.Factory] the player reads it through:
 * a custom URI scheme, an authenticated or pinned transport, decryption, or
 * storage the module owns. A source a provider handles skips `expo-video`'s
 * disk cache; the provider owns storage.
 */
@OptIn(UnstableApi::class)
interface VideoDataSourceProvider {
  /** A stable identifier used to register, replace, and unregister the provider. */
  val identifier: String

  /** Selection order when several providers match the same source. Higher values take precedence. */
  val priority: Int

  /** The factory to load the source with, or `null` when this provider doesn't handle it. */
  fun makeDataSourceFactory(source: VideoDataSourceDescriptor): DataSource.Factory?
}
