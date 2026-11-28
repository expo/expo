package expo.modules.video.transport

import android.net.Uri
import expo.modules.video.enums.ContentType
import expo.modules.video.records.VideoSource

/**
 * A stable public description of the source being evaluated by a
 * [VideoDataSourceProvider].
 *
 * Gives external modules what they need to match and load a source without
 * depending on `expo-video`'s internal [VideoSource], the same as
 * `VideoAssetSourceDescriptor` on iOS.
 */
data class VideoDataSourceDescriptor(
  /** The source URI being evaluated. */
  val uri: Uri,
  /** Optional HTTP headers associated with the source. */
  val headers: Map<String, String>?,
  /** Whether the source requested built-in caching. */
  val usesCaching: Boolean,
  /** Whether the source includes DRM configuration. */
  val hasDRM: Boolean,
  /** A best-effort content type hint from the source configuration. */
  val contentTypeHint: ContentType
) {
  internal companion object {
    fun from(videoSource: VideoSource): VideoDataSourceDescriptor? {
      val uri = videoSource.uri ?: return null
      return VideoDataSourceDescriptor(
        uri = uri,
        headers = videoSource.headers,
        usesCaching = videoSource.useCaching,
        hasDRM = videoSource.drm != null,
        contentTypeHint = videoSource.contentType
      )
    }
  }
}
