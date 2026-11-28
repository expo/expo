package expo.modules.videodashsupport

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.ResolvingDataSource
import expo.modules.video.transport.VideoDataSourceDescriptor
import expo.modules.video.transport.VideoDataSourceProvider

/**
 * Plays `expo-video-https://` sources by reading them over HTTPS: the provider
 * returns a `ResolvingDataSource` that rewrites each request's scheme. A real
 * provider would add its own transport here (authentication, pinning,
 * decryption, local storage).
 */
@OptIn(UnstableApi::class)
class CustomSchemeDataSourceProvider(
  private val onMatch: (VideoDataSourceDescriptor) -> Unit
) : VideoDataSourceProvider {
  override val identifier = PROVIDER_ID
  override val priority = 500

  override fun makeDataSourceFactory(source: VideoDataSourceDescriptor): DataSource.Factory? {
    if (source.uri.scheme != SCHEME) {
      return null
    }
    onMatch(source)
    return ResolvingDataSource.Factory(DefaultHttpDataSource.Factory()) { dataSpec ->
      dataSpec.withUri(dataSpec.uri.buildUpon().scheme("https").build())
    }
  }

  companion object {
    const val PROVIDER_ID = "bare-expo.custom-scheme-loader"
    const val SCHEME = "expo-video-https"
  }
}
