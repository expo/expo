package expo.modules.video.records

import android.annotation.SuppressLint
import android.content.ContentResolver
import android.content.Context
import android.net.Uri
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.RawResourceDataSource
import androidx.media3.exoplayer.source.MediaSource
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.video.UnsupportedDRMTypeException
import expo.modules.video.buildExpoVideoMediaSource
import expo.modules.video.enums.ContentType
import java.io.Serializable

@OptIn(UnstableApi::class)
class VideoSource(
  @Field var uri: Uri? = null,
  @Field var drm: DRMOptions? = null,
  @Field var metadata: VideoMetadata? = null,
  @Field var headers: Map<String, String>? = null,
  @Field var useCaching: Boolean = false,
  @Field val contentType: ContentType = ContentType.AUTO,
  @Field val subtitles: List<SubtitleSource>? = null
) : Record, Serializable {
  private fun toMediaId(): String {
    return "uri:${this.uri}" +
      "Headers: ${this.headers}" +
      "DrmType:${this.drm?.type}" +
      "DrmLicenseServer:${this.drm?.licenseServer}" +
      "DrmMultiKey:${this.drm?.multiKey}" +
      "DRMHeadersKeys:${this.drm?.headers?.keys?.joinToString { it }}}" +
      "DRMHeadersValues:${this.drm?.headers?.values?.joinToString { it }}}" +
      "NotificationDataTitle:${this.metadata?.title}" +
      "NotificationDataSecondaryText:${this.metadata?.artist}" +
      "NotificationDataArtwork:${this.metadata?.artwork?.path}" +
      "ContentType:${this.contentType.value}"
  }

  fun toMediaSource(context: Context): MediaSource? {
    this.uri ?: return null
    return buildExpoVideoMediaSource(context, this)
  }

  fun toMediaItem(context: Context) = MediaItem
    .Builder()
    .apply {
      setUri(parseLocalAssetId(uri, context))
      contentType.toMimeTypeString()?.let {
        setMimeType(it)
      }
      drm?.let {
        if (it.type.isSupported()) {
          setDrmConfiguration(it.toDRMConfiguration())
        } else {
          throw UnsupportedDRMTypeException(it.type)
        }
      }
      setMediaMetadata(
        MediaMetadata.Builder().apply {
          metadata?.let { data ->
            setTitle(data.title)
            setArtist(data.artist)
            data.artwork?.let {
              setArtworkUri(it)
            }
          }
        }.build()
      )
      subtitles?.forEach { subtitleSource ->
        subtitleSource.uri?.let { subtitleUri ->
          val subtitleConfig = MediaItem.SubtitleConfiguration.Builder(subtitleUri).apply {
            // WebVTT is the most widely supported sidecar subtitle format on Android.
            // Fall back to WebVTT as the default when the URI extension is not recognised.
            val mimeType = when (subtitleUri.lastPathSegment?.substringAfterLast(".")?.lowercase()) {
              "srt" -> androidx.media3.common.MimeTypes.APPLICATION_SUBRIP
              "ttml", "xml", "dfxp" -> androidx.media3.common.MimeTypes.APPLICATION_TTML
              "ssa", "ass" -> androidx.media3.common.MimeTypes.TEXT_SSA
              else -> androidx.media3.common.MimeTypes.TEXT_VTT
            }
            setMimeType(mimeType)
            subtitleSource.language?.let { setLanguage(it) }
            subtitleSource.label?.let { setLabel(it) }
          }.build()
          addSubtitleConfiguration(subtitleConfig)
        }
      }
    }
    .build()

  // Using `resolveAssetSource` to generate a local asset URI returns a resource name for android release builds
  // we have to get the raw resource URI to play the video
  @SuppressLint("DiscouragedApi") // AFAIK, in this case, there's no other way to get the resource URI
  private fun parseLocalAssetId(uri: Uri?, context: Context): Uri? {
    if (uri == null || uri.scheme != null) {
      return uri
    }
    try {
      val resourceId: Int = context.resources.getIdentifier(
        uri.toString(),
        "raw",
        context.packageName
      )
      val parsedUri = Uri.Builder()
        .scheme(ContentResolver.SCHEME_ANDROID_RESOURCE)
        .appendPath(resourceId.toString())
        .build()
      val dataSpec = DataSpec(parsedUri)
      val rawResourceDataSource = RawResourceDataSource(context)
      rawResourceDataSource.open(dataSpec)
      return rawResourceDataSource.uri
    } catch (e: RawResourceDataSource.RawResourceDataSourceException) {
      Log.e("ExpoVideo", "Error parsing local asset id, falling back to original uri", e)
      return uri
    }
  }
}
