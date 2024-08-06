package expo.modules.video

import android.content.Context
import android.content.pm.ApplicationInfo
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.common.util.Util
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.MediaSource
import expo.modules.video.records.VideoSource
import okhttp3.OkHttpClient

@OptIn(UnstableApi::class)
fun buildDataSourceFactory(context: Context, videoSource: VideoSource): DataSource.Factory {
  return if (videoSource.uri?.scheme?.startsWith("http") == true) {
    buildOkHttpDataSourceFactory(context, videoSource)
  } else {
    DefaultDataSource.Factory(context)
  }
}

@OptIn(UnstableApi::class)
fun buildOkHttpDataSourceFactory(context: Context, videoSource: VideoSource): OkHttpDataSource.Factory {
  val client = OkHttpClient.Builder().build()
  val userAgent = Util.getUserAgent(context, getApplicationName(context))
  return OkHttpDataSource.Factory(client).apply {
    videoSource.headers?.let {
      if (it.isNotEmpty()) {
        setDefaultRequestProperties(it)
      }
    }
    setUserAgent(userAgent)
  }
}

fun buildMediaSourceFactory(context: Context, dataSourceFactory: DataSource.Factory): MediaSource.Factory {
  return DefaultMediaSourceFactory(context).setDataSourceFactory(dataSourceFactory)
}

@OptIn(UnstableApi::class)
fun buildMediaSourceWithHeaders(context: Context, videoSource: VideoSource): MediaSource {
  val dataSourceFactory = buildDataSourceFactory(context, videoSource)
  val mediaSourceFactory = buildMediaSourceFactory(context, dataSourceFactory)
  val mediaItem = videoSource.toMediaItem(context)
  return mediaSourceFactory.createMediaSource(mediaItem)
}

private fun getApplicationName(context: Context): String {
  val applicationInfo: ApplicationInfo = context.applicationInfo
  val stringId = applicationInfo.labelRes
  return if (stringId == 0) applicationInfo.nonLocalizedLabel.toString() else context.getString(stringId)
}
