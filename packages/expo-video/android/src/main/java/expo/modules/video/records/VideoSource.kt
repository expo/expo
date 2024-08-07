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
import expo.modules.video.buildMediaSourceWithHeaders
import java.io.Serializable

@OptIn(UnstableApi::class)
class VideoSource(
  @Field var uri: Uri? = null,
  @Field var drm: DRMOptions? = null,
  @Field var metadata: VideoMetadata? = null,
  @Field var headers: Map<String, String>? = null
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
      "NotificationDataSecondaryText:${this.metadata?.artist}"
  }

  fun toMediaSource(context: Context): MediaSource {
    return buildMediaSourceWithHeaders(context, this)
  }

  fun toMediaItem(context: Context) = MediaItem
    .Builder()
    .apply {
      setUri(parseLocalAssetId(uri, context))
      setMediaId(toMediaId())
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
          }
        }.build()
      )
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
