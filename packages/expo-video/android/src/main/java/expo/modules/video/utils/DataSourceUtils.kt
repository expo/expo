package expo.modules.video

import android.content.Context
import android.content.pm.ApplicationInfo
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.common.util.Util
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.ima.ImaAdsLoader
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.MediaSource
import expo.modules.video.player.PlayerView
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

  // If the application name has ANY non-ASCII characters, we need to strip them out. This is because using non-ASCII characters
  // in the User-Agent header can cause issues with getting the media to play.
  val applicationName = getApplicationName(context).filter { it.code in 0..127 }

  val defaultUserAgent = Util.getUserAgent(context, applicationName)

  return OkHttpDataSource.Factory(client).apply {
    val headers = videoSource.headers
    headers?.takeIf { it.isNotEmpty() }?.let {
      setDefaultRequestProperties(it)
    }
    val userAgent = headers?.get("User-Agent") ?: defaultUserAgent
    setUserAgent(userAgent)
  }
}

fun buildMediaSourceFactory(context: Context, dataSourceFactory: DataSource.Factory, adsLoader: ImaAdsLoader, playerView: PlayerView?): MediaSource.Factory {
  val mediaSourceFactory = DefaultMediaSourceFactory(context).setDataSourceFactory(dataSourceFactory)
  if( playerView !== null ){
    mediaSourceFactory.setLocalAdInsertionComponents({ unusedAdTagUri -> adsLoader }, playerView)
  }
  return mediaSourceFactory
}

@OptIn(UnstableApi::class)
fun buildMediaSourceWithHeaders(context: Context, videoSource: VideoSource, adsLoader: ImaAdsLoader, playerView: PlayerView?): MediaSource {
  val dataSourceFactory = buildDataSourceFactory(context, videoSource)
  val mediaSourceFactory = buildMediaSourceFactory(context, dataSourceFactory, adsLoader, playerView)
  val mediaItem = videoSource.toMediaItem(context)
  return mediaSourceFactory.createMediaSource(mediaItem)
}

private fun getApplicationName(context: Context): String {
  val applicationInfo: ApplicationInfo = context.applicationInfo
  val stringId = applicationInfo.labelRes
  return if (stringId == 0) applicationInfo.nonLocalizedLabel.toString() else context.getString(stringId)
}
